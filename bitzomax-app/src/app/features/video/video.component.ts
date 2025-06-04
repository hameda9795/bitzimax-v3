import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, of, switchMap, tap, delay } from 'rxjs';
import { SubscriptionService } from '../../core/services/subscription.service';
import { VideoService } from '../../core/services/video.service';
import { UserService } from '../../core/services/user.service';
import { Video } from '../../shared/models/video.model';
import { CommonModule } from '@angular/common';
import { ShareModalComponent } from './share-modal/share-modal.component';
import { UrlService } from '../../core/services/url.service';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
  standalone: true,
  imports: [CommonModule, ShareModalComponent, MatIconModule]
})
export class VideoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  
  video: Video | null = null;
  relatedVideos: Video[] = [];  isPlaying = false;
  currentTime = 0;
  duration = 0;
  isLiked = false;
  isFavorited = false;
  showSubscriptionBanner = false;
  isSubscribed = false;
  baseUrl = 'http://localhost:8080';
  showShareModal = false;
  private previewTimeLimit = 30; // 30 seconds preview for free users
  private activeVideoPlayer: HTMLVideoElement | null = null;
  
  private subscriptions = new Subscription();
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private videoService: VideoService,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private urlService: UrlService,
    private iconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) {
    // Register SVG icons for music platforms
    this.registerPlatformIcons();
  }

  // Register platform icons for music services
  private registerPlatformIcons(): void {
    // Register SVG icons for music platforms
    this.iconRegistry.addSvgIconLiteral(
      'spotify',
      this.sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      `)
    );
    
    this.iconRegistry.addSvgIconLiteral(
      'apple-music',
      this.sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.02 1.88.475 3.208c-.192.504-.292 1.044-.332 1.604-.064.836-.07 1.673-.07 2.51v8.356c.01.147.02.294.04.44.06.713.21 1.404.54 2.057.43.83 1.05 1.51 1.8 2.01.5.33 1.06.57 1.64.71.31.07.63.12.94.14.33.03.67.04 1 .04H19.04c.5-.01.99-.06 1.46-.19.55-.14 1.08-.37 1.53-.68.95-.66 1.64-1.52 2.05-2.63.22-.58.35-1.21.4-1.85.04-.45.04-.91.04-1.36V9.04c0-.97-.03-1.94-.2-2.91zm-17.85 13c-.1 0-.2-.01-.3-.02-.27-.04-.54-.11-.8-.21-.4-.16-.76-.39-1.07-.7-.37-.38-.66-.8-.89-1.28-.1-.21-.18-.43-.24-.65-.06-.22-.1-.45-.12-.68 0-.09-.01-.18-.01-.26v-8.31c0-.89.11-1.77.45-2.6.2-.5.49-.93.86-1.31.39-.4.83-.71 1.33-.91.22-.09.45-.16.68-.21.25-.06.5-.1.76-.11h13.02c.84.01 1.65.2 2.39.65.65.38 1.15.91 1.54 1.56.32.55.52 1.16.61 1.8.05.36.07.73.08 1.1v8.07c-.01.39-.04.77-.11 1.15-.09.46-.25.9-.47 1.3-.39.71-.93 1.25-1.56 1.68-.3.2-.62.36-.95.48-.35.13-.7.22-1.07.26-.12.02-.25.03-.37.03z"/>
          <path d="M15.37 14.54c-.16-.24-.37-.45-.61-.61-.19-.13-.39-.24-.61-.31-.22-.08-.45-.13-.68-.17-.04-.01-.09-.02-.14-.02-.06-.01-.12-.02-.19-.02h-5.42c-.01 0-.01 0 0 0-.05-.01-.09-.01-.13-.01-.17 0-.35.05-.5.14-.23.13-.42.32-.54.57-.08.17-.14.37-.14.57 0 .35.13.67.35.91.22.24.54.37.89.37h5.6c.32-.01.63-.13.85-.37.3-.32.46-.71.46-1.12 0-.4-.15-.79-.45-1.09-.01-.03-.02-.04-.04-.07zm-.67-6.99c-.16.13-.28.31-.32.5 0 .06-.02.11-.02.17v2.46c0 .1-.03.2-.08.28-.05.08-.12.15-.2.18-.08.04-.17.05-.25.04-.08-.01-.15-.04-.22-.09-.14-.1-.25-.22-.34-.36-.26-.38-.31-.85-.14-1.28.07-.19.2-.37.35-.5.19-.15.4-.24.64-.29.07-.01.14-.02.2-.02h.06c.2 0 .39.07.54.19.05.04.09.09.12.14.1.06.04.11.04.17-.06.05-.04.1-.08.14-.13 0-.24.07-.3.21z"/>
        </svg>
      `)
    );
    
    this.iconRegistry.addSvgIconLiteral(
      'itunes',
      this.sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M11.977 23.999c1.848 0 3.64-.419 5.286-1.251a13.224 13.224 0 0 0 4.265-3.418 13.225 13.225 0 0 0 2.463-4.635C24.658 12.933 24.997 11.11 25 9.31v-.03c-.004-1.767-.317-3.57-.971-5.337a13.236 13.236 0 0 0-2.67-4.32 13.305 13.305 0 0 0-4.472-3.02A13.165 13.165 0 0 0 12 .027 13.252 13.252 0 0 0 7.318 1.08 13.19 13.19 0 0 0 2.69 4.047 13.365 13.365 0 0 0 .325 10.304 13.043 13.043 0 0 0 0 13.513c.04 1.767.344 3.53.96 5.27a13.265 13.265 0 0 0 2.61 4.312c1.118 1.25 2.473 2.289 3.93 3.01a13.07 13.07 0 0 0 4.477 1.083h.889v-9.278l-.127.053c-.99.402-1.856.89-2.663 1.421-.502.33-.997.673-1.466 1.041l-.038.03a.763.763 0 0 1-.968-1.18l.08-.066 2.795-2.282v-6.445l-.71.292a153.36 153.36 0 0 0-2.812 1.192 77.33 77.33 0 0 0-2.533 1.17c-.764.369-1.51.739-2.243 1.12-.503.262-.99.537-1.473.843l-.19.12a.76.76 0 0 1-.757-1.313l.062-.037c.376-.232.758-.456 1.142-.672.49-.275 1.078-.602 1.747-.965l.235-.128c.963-.525 2.055-1.113 3.232-1.736 1.521-.807 3.184-1.672 4.811-2.507l.191-.099V6.846l-.45.155a176.425 176.425 0 0 0-2.802.978 99.88 99.88 0 0 0-2.67 1.012c-.78.31-1.54.623-2.292.943a137.64 137.64 0 0 0-2.8 1.225c-.485.22-.933.428-1.375.64a59.595 59.595 0 0 0-1.43.705.764.764 0 1 1-.743-1.332c.282-.158.611-.33.979-.516.84-.425 1.891-.934 3.097-1.5a179.143 179.143 0 0 1 3.534-1.601 172.209 172.209 0 0 1 3.659-1.54V3.264A9.758 9.758 0 0 1 12 3a9.899 9.899 0 0 1 7.684 3.631 10.203 10.203 0 0 1 2.022 3.255c.517 1.296.781 2.68.792 4.08v.03c-.003 1.392-.268 2.793-.783 4.093a10.165 10.165 0 0 1-1.937 2.988 10.134 10.134 0 0 1-2.535 2.038 9.77 9.77 0 0 1-3.29.96V10.022l7.076-2.301.03-.01a.763.763 0 1 1 .473 1.452l-.02.007-6.558 2.131v12.698h-.905z"/>
        </svg>
      `)
    );
    
    this.iconRegistry.addSvgIconLiteral(
      'youtube-music',
      this.sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm4.843 9.876L10.121 6.5a.577.577 0 0 0-.843.516v6.769c0 .442.468.716.843.516l6.722-3.376a.578.578 0 0 0 0-1.049z"/>
        </svg>
      `)
    );
    
    this.iconRegistry.addSvgIconLiteral(
      'amazon-music',
      this.sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705c-.209.189-.512.201-.745.074-1.052-.872-1.238-1.276-1.814-2.106-1.734 1.767-2.962 2.297-5.209 2.297-2.66 0-4.731-1.641-4.731-4.925 0-2.565 1.391-4.309 3.37-5.164 1.715-.763 4.108-.897 5.942-1.105v-.41c0-.753.06-1.642-.383-2.294-.385-.575-1.123-.813-1.774-.813-1.205 0-2.277.618-2.54 1.897-.055.285-.266.566-.555.58l-3.103-.333c-.262-.055-.552-.266-.478-.66C5.628 1.32 8.407.395 10.893.395c1.242 0 2.863.33 3.837 1.265 1.242 1.157 1.12 2.704 1.12 4.387v3.969c0 1.194.495 1.718.96 2.362.164.222.201.486-.009.65-.525.441-1.459 1.256-1.973 1.713l-.008-.054-.666-.392z"/>
        </svg>
      `)
    );
    
    this.iconRegistry.addSvgIconLiteral(
      'instagram',
      this.sanitizer.bypassSecurityTrustHtml(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
        </svg>
      `)
    );
  }
  
  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.pipe(
        switchMap(params => {
          const videoId = params.get('id')?.split('-')[0]; // Get the numeric ID part
          if (!videoId) {
            return of(null);
          }
          
          return this.videoService.getVideoById(videoId).pipe(
            tap(video => {
              if (video) {
                // Check if URL needs to be updated with proper slug
                const currentSlug = params.get('slug');
                const properSlug = this.urlService.createSlug(video.title);
                
                if (currentSlug !== properSlug) {
                  // Update URL without reloading the page
                  this.router.navigate(['/video', videoId, properSlug], {
                    replaceUrl: true,
                    skipLocationChange: false
                  });
                }

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
                
                // Check if the video is liked and favorited by the user
                this.userService.getCurrentUser().subscribe(user => {
                  this.isLiked = user && user.likedVideos ? user.likedVideos.includes(video.id) : false;
                  this.isFavorited = user && user.favoriteVideos ? user.favoriteVideos.includes(video.id) : false;
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
        if (this.video) this.video.likes++;
      } else if (this.video && this.video.likes > 0) {
        this.video.likes--;
      }
    });
  }

  toggleFavorite(): void {
    if (!this.video) return;

    if (this.isFavorited) {
      this.userService.removeFromFavorites(this.video.id).subscribe(success => {
        if (success) {
          this.isFavorited = false;
        }
      });
    } else {
      this.userService.addToFavorites(this.video.id).subscribe(success => {
        if (success) {
          this.isFavorited = true;
        }
      });
    }
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
