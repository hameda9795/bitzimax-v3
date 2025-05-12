import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, SubscriptionDetails } from '../../shared/models/user.model';
import { SubscriptionService } from './subscription.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Mock current user data
  private currentUser: User = {
    id: 'u1',
    username: 'cyberuser_9984',
    email: 'user@bitzomax.com',
    displayName: 'CyberUser_9984',
    avatarUrl: 'https://via.placeholder.com/150/0a0014/00e1ff?text=User',
    joinDate: new Date('2025-05-01'),
    isSubscribed: false,
    favoriteVideos: ['v1', 'v2'],
    likedVideos: ['v1', 'v4', 'v6'],
    watchHistory: [
      {
        videoId: 'v1',
        timestamp: new Date('2025-05-10'),
        watchDuration: 160,
        completed: false
      },
      {
        videoId: 'v4',
        timestamp: new Date('2025-05-11'),
        watchDuration: 340,
        completed: false
      }
    ]
  };

  private currentUserSubject = new BehaviorSubject<User>(this.currentUser);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private subscriptionService: SubscriptionService) {
    // Subscribe to subscription service changes to keep user subscription status in sync
    this.subscriptionService.subscriptionStatus$.subscribe(isSubscribed => {
      this.updateSubscriptionStatus(isSubscribed);
    });

    this.subscriptionService.subscriptionEndDate$.subscribe(endDate => {
      if (endDate) {
        this.updateSubscriptionDetails({
          plan: 'monthly',
          startDate: new Date(),
          endDate: endDate,
          autoRenew: true,
          price: 6
        });
      } else if (this.currentUser.subscriptionDetails) {
        // Clear subscription details if subscription is cancelled
        this.updateSubscriptionDetails(undefined);
      }
    });
  }

  /**
   * Get current user data
   */
  getCurrentUser(): Observable<User> {
    return this.currentUser$;
  }

  /**
   * Update user subscription status
   */
  private updateSubscriptionStatus(isSubscribed: boolean): void {
    this.currentUser = {
      ...this.currentUser,
      isSubscribed
    };
    this.currentUserSubject.next(this.currentUser);
  }

  /**
   * Update subscription details
   */
  private updateSubscriptionDetails(details?: SubscriptionDetails): void {
    this.currentUser = {
      ...this.currentUser,
      subscriptionDetails: details
    };
    this.currentUserSubject.next(this.currentUser);
  }

  /**
   * Add video to favorites
   */
  addToFavorites(videoId: string): Observable<boolean> {
    if (!this.currentUser.favoriteVideos.includes(videoId)) {
      this.currentUser = {
        ...this.currentUser,
        favoriteVideos: [...this.currentUser.favoriteVideos, videoId]
      };
      this.currentUserSubject.next(this.currentUser);
      return of(true);
    }
    return of(false);
  }

  /**
   * Remove video from favorites
   */
  removeFromFavorites(videoId: string): Observable<boolean> {
    const index = this.currentUser.favoriteVideos.indexOf(videoId);
    if (index !== -1) {
      const updatedFavorites = [...this.currentUser.favoriteVideos];
      updatedFavorites.splice(index, 1);
      this.currentUser = {
        ...this.currentUser,
        favoriteVideos: updatedFavorites
      };
      this.currentUserSubject.next(this.currentUser);
      return of(true);
    }
    return of(false);
  }

  /**
   * Check if video is in favorites
   */
  isInFavorites(videoId: string): boolean {
    return this.currentUser.favoriteVideos.includes(videoId);
  }

  /**
   * Toggle like status for a video
   */
  toggleVideoLike(videoId: string): Observable<boolean> {
    const isLiked = this.currentUser.likedVideos.includes(videoId);
    
    if (isLiked) {
      // Remove from liked videos
      const updatedLikes = this.currentUser.likedVideos.filter(id => id !== videoId);
      this.currentUser = {
        ...this.currentUser,
        likedVideos: updatedLikes
      };
    } else {
      // Add to liked videos
      this.currentUser = {
        ...this.currentUser,
        likedVideos: [...this.currentUser.likedVideos, videoId]
      };
    }
    
    this.currentUserSubject.next(this.currentUser);
    return of(!isLiked);
  }

  /**
   * Track video watch progress
   */
  trackVideoWatch(videoId: string, duration: number, completed: boolean): void {
    const existingIndex = this.currentUser.watchHistory.findIndex(item => item.videoId === videoId);
    
    const watchRecord = {
      videoId,
      timestamp: new Date(),
      watchDuration: duration,
      completed
    };
    
    if (existingIndex !== -1) {
      // Update existing record
      const updatedHistory = [...this.currentUser.watchHistory];
      updatedHistory[existingIndex] = watchRecord;
      this.currentUser = {
        ...this.currentUser,
        watchHistory: updatedHistory
      };
    } else {
      // Add new record
      this.currentUser = {
        ...this.currentUser,
        watchHistory: [...this.currentUser.watchHistory, watchRecord]
      };
    }
    
    this.currentUserSubject.next(this.currentUser);
  }
}
