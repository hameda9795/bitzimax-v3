import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { Subscription, forkJoin, of } from 'rxjs';
import { SubscriptionService } from '../../core/services/subscription.service';
import { UserService } from '../../core/services/user.service';
import { VideoService } from '../../core/services/video.service';
import { Video } from '../../shared/models/video.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe],
  providers: [DatePipe]
})
export class ProfileComponent implements OnInit, OnDestroy {
  isSubscribed = false;
  subscriptionStartDate: Date = new Date();
  subscriptionEndDate: Date | null = null;
  subscriptionPercentRemaining = 0;

  favoriteVideos: Video[] = [];
  likedVideos: Video[] = [];
  viewsCount = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private subscriptionService: SubscriptionService,
    private userService: UserService,
    private videoService: VideoService
  ) { }

  ngOnInit(): void {
    // Subscribe to subscription status changes
    this.subscriptions.add(
      this.subscriptionService.subscriptionStatus$.subscribe(status => {
        this.isSubscribed = status;
        this.calculateSubscriptionTimeRemaining();
      })
    );
    
    // Subscribe to subscription end date changes
    this.subscriptions.add(
      this.subscriptionService.subscriptionEndDate$.subscribe(endDate => {
        this.subscriptionEndDate = endDate;
        this.calculateSubscriptionTimeRemaining();
      })
    );

    // Initial state
    this.isSubscribed = this.subscriptionService.isSubscribed();

    // Load user favorites and liked videos
    this.userService.getCurrentUser().subscribe(user => {
      if (!user) {
        this.favoriteVideos = [];
        this.likedVideos = [];
        this.viewsCount = 0;
        return;
      }

      const fav$ = this.videoService.getVideosByIds(user.favoriteVideos);
      const liked$ = this.videoService.getVideosByIds(user.likedVideos);
      forkJoin([fav$, liked$]).subscribe(([favVideos, likedVideos]) => {
        this.favoriteVideos = favVideos;
        this.likedVideos = likedVideos;
        this.viewsCount = user.watchHistory ? user.watchHistory.length : 0;
      });
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.unsubscribe();
  }

  /**
   * Subscribe the user to the premium plan
   */
  subscribe(): void {
    this.subscriptionService.subscribe();
    this.subscriptionStartDate = new Date();
  }

  /**
   * Cancel the user's subscription
   */
  cancelSubscription(): void {
    if (confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      this.subscriptionService.cancelSubscription();
    }
  }

  removeFavorite(videoId: string): void {
    this.userService.removeFromFavorites(videoId).subscribe(success => {
      if (success) {
        this.favoriteVideos = this.favoriteVideos.filter(v => v.id !== videoId);
      }
    });
  }

  /**
   * Calculate the percentage of subscription time remaining
   */
  private calculateSubscriptionTimeRemaining(): void {
    if (!this.isSubscribed || !this.subscriptionEndDate) {
      this.subscriptionPercentRemaining = 0;
      return;
    }
    
    const now = new Date();
    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const startTime = new Date(this.subscriptionEndDate.getTime() - oneMonth).getTime();
    const endTime = this.subscriptionEndDate.getTime();
    const currentTime = now.getTime();
    
    // Calculate percentage of time remaining in subscription period
    const totalDuration = endTime - startTime;
    const elapsed = currentTime - startTime;
    const percentElapsed = (elapsed / totalDuration) * 100;
    
    this.subscriptionPercentRemaining = Math.max(0, Math.min(100, 100 - percentElapsed));
  }
}
