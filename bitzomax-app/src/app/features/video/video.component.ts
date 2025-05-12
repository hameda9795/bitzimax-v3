import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, of, switchMap, tap } from 'rxjs';
import { SubscriptionService } from '../../core/services/subscription.service';
import { VideoService } from '../../core/services/video.service';
import { UserService } from '../../core/services/user.service';
import { Video } from '../../shared/models/video.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class VideoComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;
  
  video: Video | null = null;
  relatedVideos: Video[] = [];
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  isLiked = false;
  showSubscriptionBanner = false;
  isSubscribed = false;
  private previewTimeLimit = 30; // 30 seconds preview for free users
  
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
                this.video = video;
                // Load related videos
                this.videoService.getRelatedVideos(video.id).subscribe(related => {
                  this.relatedVideos = related;
                });
                // Check if the video is liked by the user
                this.userService.getCurrentUser().subscribe(user => {
                  this.isLiked = user.likedVideos.includes(video.id);
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
    if (this.videoPlayer) {
      const video = this.videoPlayer.nativeElement;
      
      video.addEventListener('loadedmetadata', () => {
        this.duration = video.duration;
      });

      video.addEventListener('timeupdate', () => {
        this.currentTime = video.currentTime;
      });
    }
  }

  togglePlayPause(): void {
    if (!this.videoPlayer) return;
    
    const video = this.videoPlayer.nativeElement;
    if (video.paused) {
      video.play();
      this.isPlaying = true;
    } else {
      video.pause();
      this.isPlaying = false;
    }
  }

  checkVideoTime(): void {
    if (!this.videoPlayer || !this.video) return;
    
    // Only check time limit for premium videos when user is not subscribed
    if (this.video.isPremium && !this.isSubscribed && 
        this.videoPlayer.nativeElement.currentTime >= this.previewTimeLimit) {
      this.videoPlayer.nativeElement.pause();
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
    if (this.videoPlayer && this.videoPlayer.nativeElement.paused) {
      this.videoPlayer.nativeElement.play();
      this.isPlaying = true;
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
