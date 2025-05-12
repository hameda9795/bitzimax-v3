import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private subscriptionStatusSubject = new BehaviorSubject<boolean>(false);
  public subscriptionStatus$: Observable<boolean> = this.subscriptionStatusSubject.asObservable();
  
  private subscriptionPlanSubject = new BehaviorSubject<string>('');
  public subscriptionPlan$: Observable<string> = this.subscriptionPlanSubject.asObservable();
  
  private subscriptionEndDateSubject = new BehaviorSubject<Date | null>(null);
  public subscriptionEndDate$: Observable<Date | null> = this.subscriptionEndDateSubject.asObservable();

  constructor() { 
    // Load subscription status from local storage on init
    this.loadSubscriptionStatus();
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
  subscribe(): void {
    // In a real app, this would involve payment processing
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    
    this.subscriptionStatusSubject.next(true);
    this.subscriptionPlanSubject.next('monthly');
    this.subscriptionEndDateSubject.next(subscriptionEndDate);
    
    // Save to local storage
    this.saveSubscriptionStatus();
  }

  /**
   * Cancel user subscription
   */
  cancelSubscription(): void {
    // In a real app, this would involve updating payment provider
    this.subscriptionStatusSubject.next(false);
    this.subscriptionPlanSubject.next('');
    this.subscriptionEndDateSubject.next(null);
    
    // Update local storage
    this.saveSubscriptionStatus();
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
   * Save subscription data to local storage
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
   * Load subscription data from local storage
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
        this.cancelSubscription();
        return;
      }
    }
    
    this.subscriptionStatusSubject.next(isSubscribed);
    this.subscriptionPlanSubject.next(subscriptionPlan);
    this.subscriptionEndDateSubject.next(subscriptionEndDate);
  }
}
