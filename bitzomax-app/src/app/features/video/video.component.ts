import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, of, switchMap, tap, delay } from 'rxjs';
import { SubscriptionService } from '../../core/services/subscription.service';
import { VideoService } from '../../core/services/video.service';
import { UserService } from '../../core/services/user.service';
import { Video } from '../../shared/models/video.model';
import { CommonModule } from '@angular/common';
import { ShareModalComponent } from './share-modal/share-modal.component';

@Component({  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
  standalone: true,
  imports: [CommonModule, ShareModalComponent]
})
export class VideoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  
  video: Video | null = null;
  relatedVideos: Video[] = [];  isPlaying = false;
  currentTime = 0;
  duration = 0;
  isLiked = false;
  showSubscriptionBanner = false;
  isSubscribed = false;
  baseUrl = 'http://localhost:8080';
  showShareModal = false;
  private previewTimeLimit = 30; // 30 seconds preview for free users
  private activeVideoPlayer: HTMLVideoElement | null = null;
  
  private subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private videoService: VideoService,
    private userService: UserService,
    private subscriptionService: SubscriptionService
  ) { }

  ngOnInit(): void {
    // Get video ID from route params
    this.subscriptions.add(
      this.route.paramMap.pipe(
        switchMap(params => {
          const videoId = params.get('id');
          if (!videoId) {
            return of(null);
          }
          
          // Load video data
          return this.videoService.getVideoById(videoId).pipe(
            tap(video => {
              if (video) {
                // Process video URLs
                this.video = {
                  ...video,
                  thumbnailUrl: this.ensureFullUrl(video.thumbnailUrl),
                  videoUrl: this.ensureFullUrl(video.videoUrl)
                };
                
                // Load related videos
                this.videoService.getRelatedVideos(video.id).subscribe(related => {
                  this.relatedVideos = related.map(v => ({
                    ...v,
                    thumbnailUrl: this.ensureFullUrl(v.thumbnailUrl),
                    videoUrl: this.ensureFullUrl(v.videoUrl)
                  }));
                });
                
                // Check if the video is liked by the user
                this.userService.getCurrentUser().subscribe(user => {
                  this.isLiked = user && user.likedVideos ? user.likedVideos.includes(video.id) : false;
                });
              }
            })
          );
        })
      ).subscribe()
    );
    
    // Check subscription status
    this.subscriptions.add(
      this.subscriptionService.subscriptionStatus$.subscribe(status => {
        this.isSubscribed = status;
      })
    );
  }

  /**
   * Make sure URL starts with the base URL
   */
  private ensureFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') 
      ? `${this.baseUrl}${url}` 
      : `${this.baseUrl}/${url}`;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Save watch progress before leaving
    if (this.video && this.currentTime > 0) {
      this.userService.trackVideoWatch(
        this.video.id,
        this.currentTime,
        this.currentTime >= (this.duration * 0.9) // consider "completed" if 90% watched
      );
    }
  }

  ngAfterViewInit(): void {
    // Wait for change detection to complete
    setTimeout(() => {
      this.initializeVideoPlayers();
    }, 0);

    // Handle video player changes (for responsive layouts)
    this.videoPlayers.changes.subscribe(() => {
      this.initializeVideoPlayers();
    });
  }

  /**
   * Initialize all video players and set up event listeners
   */
  private initializeVideoPlayers(): void {
    if (this.videoPlayers && this.videoPlayers.length > 0) {
      // Get the first visible video player
      const visiblePlayer = this.videoPlayers.find(player => {
        const element = player.nativeElement;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      if (visiblePlayer) {
        const video = visiblePlayer.nativeElement;
        
        // Transfer state from the previous active player if needed
        if (this.activeVideoPlayer && this.activeVideoPlayer !== video) {
          const wasPlaying = !this.activeVideoPlayer.paused;
          const currentTime = this.activeVideoPlayer.currentTime;
          
          // Apply the state to the new player
          video.currentTime = currentTime;
          if (wasPlaying) {
            video.play().catch(err => console.error('Error playing video:', err));
          }
        }
        
        // Update the active player reference
        this.activeVideoPlayer = video;
        
        // Set up event listeners
        video.addEventListener('loadedmetadata', () => {
          this.updateVideoDuration(video);
        });

        video.addEventListener('durationchange', () => {
          this.updateVideoDuration(video);
        });

        video.addEventListener('timeupdate', () => {
          this.currentTime = video.currentTime;
        });
        
        video.addEventListener('play', () => {
          this.isPlaying = true;
        });
        
        video.addEventListener('pause', () => {
          this.isPlaying = false;
        });
        
        // Make sure poster doesn't stay visible when playing
        video.addEventListener('playing', () => {
          video.style.objectFit = 'contain';
        });
        
        // Ensure the video is properly loaded
        if (video.readyState >= 1) {
          this.updateVideoDuration(video);
        }
      }
    }
  }

  /**
   * Helper method to update duration from video element
   */
  private updateVideoDuration(videoElement: HTMLVideoElement): void {
    if (videoElement.duration && !isNaN(videoElement.duration) && videoElement.duration > 0) {
      // Always use the video element's duration when available
      this.duration = videoElement.duration;
      
      // Update the model as well to keep them in sync
      if (this.video) {
        // Update the video model so this accurate duration can be saved
        const previousDuration = this.video.duration;
        this.video.duration = videoElement.duration;
        
        // Always update the duration in the backend when we have an actual value from the video element
        // This ensures we always have the accurate duration even after page refresh
        console.log('Updating video duration in backend:', 
          {videoId: this.video.id, stored: previousDuration, actual: videoElement.duration});
        
        // Call the video service to update the duration everywhere, allowing refresh since this is the main video
        this.videoService.updateVideoDuration(this.video.id, videoElement.duration, false);
      }
      
      console.log('Updated video duration:', this.duration);
    } else if (this.video && this.video.duration > 0) {
      // Fallback to model duration
      this.duration = this.video.duration;
      console.log('Using model duration:', this.duration);
    }
  }

  togglePlayPause(): void {
    if (!this.activeVideoPlayer) {
      // If no active player, try to find one
      if (this.videoPlayers && this.videoPlayers.length > 0) {
        this.activeVideoPlayer = this.videoPlayers.first.nativeElement;
      } else {
        return;
      }
    }
    
    if (this.activeVideoPlayer.paused) {
      this.activeVideoPlayer.play().catch(err => console.error('Error playing video:', err));
      this.isPlaying = true;
    } else {
      this.activeVideoPlayer.pause();
      this.isPlaying = false;
    }
  }

  checkVideoTime(): void {
    if (!this.activeVideoPlayer || !this.video) return;
    
    // Only check time limit for premium videos when user is not subscribed
    if (this.video.isPremium && !this.isSubscribed && 
        this.activeVideoPlayer.currentTime >= this.previewTimeLimit) {
      this.activeVideoPlayer.pause();
      this.isPlaying = false;
      this.showSubscriptionBanner = true;
    }
  }

  toggleLike(): void {
    if (!this.video) return;
    
    this.userService.toggleVideoLike(this.video.id).subscribe(isLiked => {
      this.isLiked = isLiked;
      
      if (isLiked) {
        this.videoService.likeVideo(this.video!.id).subscribe(() => {
          if (this.video) this.video.likes++;
        });
      } else {
        this.videoService.unlikeVideo(this.video!.id).subscribe(() => {
          if (this.video && this.video.likes > 0) this.video.likes--;
        });
      }
    });
  }

  subscribe(): void {
    this.subscriptionService.subscribe();
    this.showSubscriptionBanner = false;
    // If video was paused for subscription, resume playing
    if (this.activeVideoPlayer && this.activeVideoPlayer.paused) {
      this.activeVideoPlayer.play().catch(err => console.error('Error playing video after subscription:', err));
      this.isPlaying = true;
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return '0:00';
    }
    
    // Format durations properly, accounting for hours if needed
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    } else {
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }

  openShareModal(): void {
    this.showShareModal = true;
    
    // If the video has a shareCount property, increment it on the backend
    if (this.video && this.video.id) {
      this.videoService.trackShare(this.video.id).subscribe({
        next: (success: boolean) => {
          if (success && this.video && this.video.shareCount !== undefined) {
            // Increment local share count
            this.video.shareCount++;
          }
        },
        error: (error: Error) => console.error('Error tracking share:', error)
      });
    }
  }

  closeShareModal(): void {
    this.showShareModal = false;
  }
}
