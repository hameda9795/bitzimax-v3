import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, catchError, map, tap } from 'rxjs';
import { User, SubscriptionDetails, WatchHistoryItem } from '../../shared/models/user.model';
import { SubscriptionService } from './subscription.service';

// Backend API response interfaces
interface UserResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  joinDate: string;
  isSubscribed: boolean;
  subscriptionDetails?: {
    plan: 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    price: number;
  };
  favoriteVideos: string[];
  likedVideos: string[];
  watchHistory: {
    videoId: string;
    timestamp: string;
    watchDuration: number;
    completed: boolean;
  }[];
}

interface ApiResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/users';
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private subscriptionService: SubscriptionService
  ) {
    // Load current user on service initialization
    this.fetchCurrentUser().subscribe();

    // Subscribe to subscription service changes to keep user subscription status in sync
    this.subscriptionService.subscriptionStatus$.subscribe((isSubscribed: boolean): void => {
      const user = this.currentUserSubject.value;
      if (user) {
        this.updateSubscriptionStatus(isSubscribed);
      }
    });

    this.subscriptionService.subscriptionEndDate$.subscribe((endDate: Date | null): void => {
      const user = this.currentUserSubject.value;
      if (user) {
        if (endDate) {
          this.updateSubscriptionDetails({
            plan: 'monthly',
            startDate: new Date(),
            endDate: endDate,
            autoRenew: true,
            price: 6
          });
        } else if (user.subscriptionDetails) {
          // Clear subscription details if subscription is cancelled
          this.updateSubscriptionDetails(undefined);
        }
      }
    });
  }

  /**
   * Fetch current user data from the server
   */
  private fetchCurrentUser(): Observable<User> {
    this.loadingSubject.next(true);
    return this.http.get<UserResponse>(`${this.apiUrl}/current`)
      .pipe(
        map((user: UserResponse): User => ({
          ...user,
          joinDate: new Date(user.joinDate),
          subscriptionDetails: user.subscriptionDetails ? {
            ...user.subscriptionDetails,
            startDate: new Date(user.subscriptionDetails.startDate),
            endDate: new Date(user.subscriptionDetails.endDate)
          } : undefined,
          watchHistory: user.watchHistory.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }))
        })),
        tap((user: User): void => {
          this.currentUserSubject.next(user);
          // Update subscription service with user's subscription status
          if (user.isSubscribed !== this.subscriptionService.isSubscribed()) {
            this.subscriptionService.updateSubscriptionFromServer(
              user.isSubscribed, 
              user.subscriptionDetails?.endDate || null
            );
          }
        }),
        tap((): void => this.loadingSubject.next(false)),
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  /**
   * Get current user data
   */
  getCurrentUser(): Observable<User | null> {
    // If we already have the user data and it's not the first load, return the cached version
    if (this.currentUserSubject.value) {
      return this.currentUser$;
    }
    
    // Otherwise fetch it from the server
    return this.fetchCurrentUser();
  }

  /**
   * Get current user synchronously (from BehaviorSubject's current value)
   * This is useful for template bindings and synchronous checks
   */
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Update user subscription status
   */
  private updateSubscriptionStatus(isSubscribed: boolean): void {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return;

    // Update the server
    this.http.patch<ApiResponse>(`${this.apiUrl}/${currentUser.id}/subscription`, { isSubscribed })
      .pipe(catchError((error: HttpErrorResponse): Observable<null> => {
        console.error('Error updating subscription status:', error);
        return of(null);
      }))
      .subscribe((): void => {
        // Update local state after server update is successful
        this.currentUserSubject.next({
          ...currentUser,
          isSubscribed
        });
      });
  }

  /**
   * Update subscription details
   */
  private updateSubscriptionDetails(details?: SubscriptionDetails): void {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return;

    // Update the server
    this.http.patch<ApiResponse>(`${this.apiUrl}/${currentUser.id}/subscription-details`, { details })
      .pipe(catchError((error: HttpErrorResponse): Observable<null> => {
        console.error('Error updating subscription details:', error);
        return of(null);
      }))
      .subscribe((): void => {
        // Update local state after server update is successful
        this.currentUserSubject.next({
          ...currentUser,
          subscriptionDetails: details
        });
      });
  }

  /**
   * Add video to favorites
   */
  addToFavorites(videoId: string): Observable<boolean> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return of(false);
    }

    return this.http.post<ApiResponse>(`${this.apiUrl}/${currentUser.id}/favorites/${videoId}`, {})
      .pipe(
        map((): boolean => {
          // Update local state after server update is successful
          if (!currentUser.favoriteVideos.includes(videoId)) {
            this.currentUserSubject.next({
              ...currentUser,
              favoriteVideos: [...currentUser.favoriteVideos, videoId]
            });
          }
          return true;
        }),
        catchError((error: HttpErrorResponse): Observable<boolean> => {
          console.error('Error adding to favorites:', error);
          return of(false);
        })
      );
  }

  /**
   * Remove video from favorites
   */
  removeFromFavorites(videoId: string): Observable<boolean> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return of(false);
    }

    return this.http.delete<ApiResponse>(`${this.apiUrl}/${currentUser.id}/favorites/${videoId}`)
      .pipe(
        map((): boolean => {
          // Update local state after server update is successful
          const index = currentUser.favoriteVideos.indexOf(videoId);
          if (index !== -1) {
            const updatedFavorites = [...currentUser.favoriteVideos];
            updatedFavorites.splice(index, 1);
            this.currentUserSubject.next({
              ...currentUser,
              favoriteVideos: updatedFavorites
            });
          }
          return true;
        }),
        catchError((error: HttpErrorResponse): Observable<boolean> => {
          console.error('Error removing from favorites:', error);
          return of(false);
        })
      );
  }

  /**
   * Check if video is in favorites
   */
  isInFavorites(videoId: string): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser ? currentUser.favoriteVideos.includes(videoId) : false;
  }

  /**
   * Toggle like status for a video
   */
  toggleVideoLike(videoId: string): Observable<boolean> {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return of(false);
    }

    const isLiked = currentUser.likedVideos.includes(videoId);
    const endpoint = `${this.apiUrl}/${currentUser.id}/likes/${videoId}`;

    return (isLiked ? 
      this.http.delete<ApiResponse>(endpoint) : 
      this.http.post<ApiResponse>(endpoint, {}))
      .pipe(
        map((): boolean => {
          // Update local state after server update is successful
          if (isLiked) {
            // Remove from liked videos
            const updatedLikes = currentUser.likedVideos.filter((id: string): boolean => id !== videoId);
            this.currentUserSubject.next({
              ...currentUser,
              likedVideos: updatedLikes
            });
          } else {
            // Add to liked videos
            this.currentUserSubject.next({
              ...currentUser,
              likedVideos: [...currentUser.likedVideos, videoId]
            });
          }
          return !isLiked;
        }),
        catchError((error: HttpErrorResponse): Observable<boolean> => {
          console.error('Error toggling video like:', error);
          return of(false);
        })
      );
  }

  /**
   * Track video watch progress
   */
  trackVideoWatch(videoId: string, duration: number, completed: boolean): void {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) return;

    const watchRecord: WatchHistoryItem = {
      videoId,
      timestamp: new Date(),
      watchDuration: duration,
      completed
    };

    this.http.post<ApiResponse>(`${this.apiUrl}/${currentUser.id}/watch-history`, watchRecord)
      .pipe(catchError((error: HttpErrorResponse): Observable<null> => {
        console.error('Error tracking video watch:', error);
        return of(null);
      }))
      .subscribe((): void => {
        // Update local state after server update is successful
        const existingIndex = currentUser.watchHistory.findIndex((item: WatchHistoryItem): boolean => item.videoId === videoId);
        
        if (existingIndex !== -1) {
          // Update existing record
          const updatedHistory = [...currentUser.watchHistory];
          updatedHistory[existingIndex] = watchRecord;
          this.currentUserSubject.next({
            ...currentUser,
            watchHistory: updatedHistory
          });
        } else {
          // Add new record
          this.currentUserSubject.next({
            ...currentUser,
            watchHistory: [...currentUser.watchHistory, watchRecord]
          });
        }
      });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError((): Error => new Error(errorMessage));
  }
}
