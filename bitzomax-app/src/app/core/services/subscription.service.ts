import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, catchError, map } from 'rxjs';

// Backend API response interfaces
interface SubscriptionStatusResponse {
  isSubscribed: boolean;
  plan: string;
  endDate: string | null;
}

interface SubscriptionActionResponse {
  success: boolean;
  endDate?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = 'http://localhost:8080/api/subscriptions';
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private subscriptionStatusSubject = new BehaviorSubject<boolean>(false);
  public subscriptionStatus$: Observable<boolean> = this.subscriptionStatusSubject.asObservable();
  
  private subscriptionPlanSubject = new BehaviorSubject<string>('');
  public subscriptionPlan$: Observable<string> = this.subscriptionPlanSubject.asObservable();
  
  private subscriptionEndDateSubject = new BehaviorSubject<Date | null>(null);
  public subscriptionEndDate$: Observable<Date | null> = this.subscriptionEndDateSubject.asObservable();

  constructor(private http: HttpClient) { 
    // Load subscription status from server on initialization
    this.fetchSubscriptionStatus();
  }

  /**
   * Fetch subscription status from server
   */
  private fetchSubscriptionStatus(): void {
    this.loadingSubject.next(true);
    this.http.get<SubscriptionStatusResponse>(`${this.apiUrl}/status`)
      .pipe(
        catchError((error: HttpErrorResponse): Observable<null> => {
          console.error('Error fetching subscription status:', error);
          // If API fails, try to fall back to local storage
          this.loadSubscriptionStatus();
          this.loadingSubject.next(false);
          return of(null);
        })
      )
      .subscribe((data: SubscriptionStatusResponse | null): void => {
        if (data) {
          this.subscriptionStatusSubject.next(data.isSubscribed);
          this.subscriptionPlanSubject.next(data.plan || '');
          this.subscriptionEndDateSubject.next(data.endDate ? new Date(data.endDate) : null);
          
          // Also save to local storage as fallback
          this.saveSubscriptionStatus();
        }
        this.loadingSubject.next(false);
      });
  }

  /**
   * Check if user is currently subscribed
   */
  isSubscribed(): boolean {
    return this.subscriptionStatusSubject.value;
  }

  /**
   * Subscribe user to the monthly plan (€6/month)
   */
  subscribe(): Observable<boolean> {
    this.loadingSubject.next(true);
    return this.http.post<SubscriptionActionResponse>(`${this.apiUrl}/subscribe`, {
      plan: 'monthly',
      price: 6,
      autoRenew: true
    })
    .pipe(
      map((response: SubscriptionActionResponse): boolean => {
        if (response.success) {
          const subscriptionEndDate = new Date(response.endDate || '');
          
          this.subscriptionStatusSubject.next(true);
          this.subscriptionPlanSubject.next('monthly');
          this.subscriptionEndDateSubject.next(subscriptionEndDate);
          
          // Save to local storage as fallback
          this.saveSubscriptionStatus();
          this.loadingSubject.next(false);
          return true;
        }
        this.loadingSubject.next(false);
        return false;
      }),
      catchError((error: HttpErrorResponse): Observable<boolean> => {
        console.error('Error subscribing:', error);
        this.loadingSubject.next(false);
        return of(false);
      })
    );
  }

  /**
   * Cancel user subscription
   */
  cancelSubscription(): Observable<boolean> {
    this.loadingSubject.next(true);
    return this.http.post<SubscriptionActionResponse>(`${this.apiUrl}/cancel`, {})
    .pipe(
      map((response: SubscriptionActionResponse): boolean => {
        if (response.success) {
          this.subscriptionStatusSubject.next(false);
          this.subscriptionPlanSubject.next('');
          this.subscriptionEndDateSubject.next(null);
          
          // Update local storage
          this.saveSubscriptionStatus();
          this.loadingSubject.next(false);
          return true;
        }
        this.loadingSubject.next(false);
        return false;
      }),
      catchError((error: HttpErrorResponse): Observable<boolean> => {
        console.error('Error cancelling subscription:', error);
        this.loadingSubject.next(false);
        return of(false);
      })
    );
  }

  /**
   * Get days remaining in current subscription
   */
  getDaysRemaining(): number {
    const endDate = this.subscriptionEndDateSubject.value;
    
    if (!endDate) {
      return 0;
    }
    
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Update subscription from server data (used by UserService to sync states)
   */
  updateSubscriptionFromServer(isSubscribed: boolean, endDate: Date | null): void {
    this.subscriptionStatusSubject.next(isSubscribed);
    
    if (isSubscribed && endDate) {
      this.subscriptionPlanSubject.next('monthly');
      this.subscriptionEndDateSubject.next(endDate);
    } else {
      this.subscriptionPlanSubject.next('');
      this.subscriptionEndDateSubject.next(null);
    }
    
    // Save to local storage as fallback
    this.saveSubscriptionStatus();
  }

  /**
   * Save subscription data to local storage (as fallback)
   */
  private saveSubscriptionStatus(): void {
    localStorage.setItem('bitzomax_isSubscribed', this.subscriptionStatusSubject.value.toString());
    localStorage.setItem('bitzomax_subscriptionPlan', this.subscriptionPlanSubject.value);
    
    const endDate = this.subscriptionEndDateSubject.value;
    if (endDate) {
      localStorage.setItem('bitzomax_subscriptionEndDate', endDate.toISOString());
    } else {
      localStorage.removeItem('bitzomax_subscriptionEndDate');
    }
  }

  /**
   * Load subscription data from local storage (fallback if API fails)
   */
  private loadSubscriptionStatus(): void {
    const isSubscribed = localStorage.getItem('bitzomax_isSubscribed') === 'true';
    const subscriptionPlan = localStorage.getItem('bitzomax_subscriptionPlan') || '';
    const subscriptionEndDateStr = localStorage.getItem('bitzomax_subscriptionEndDate');
    
    let subscriptionEndDate: Date | null = null;
    if (subscriptionEndDateStr) {
      subscriptionEndDate = new Date(subscriptionEndDateStr);
      
      // Check if subscription has expired
      if (subscriptionEndDate < new Date()) {
        // If expired, cancel the subscription
        this.cancelSubscription().subscribe();
        return;
      }
    }
    
    this.subscriptionStatusSubject.next(isSubscribed);
    this.subscriptionPlanSubject.next(subscriptionPlan);
    this.subscriptionEndDateSubject.next(subscriptionEndDate);
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
