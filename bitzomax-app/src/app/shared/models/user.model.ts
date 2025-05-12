/**
 * User model interface for the Bitzomax platform
 */
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  joinDate: Date;
  isSubscribed: boolean;
  subscriptionDetails?: SubscriptionDetails;
  favoriteVideos: string[]; // Array of video IDs
  likedVideos: string[]; // Array of video IDs
  watchHistory: WatchHistoryItem[];
}

/**
 * Subscription details model
 */
export interface SubscriptionDetails {
  plan: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  price: number; // in euros
}

/**
 * Watch history item model
 */
export interface WatchHistoryItem {
  videoId: string;
  timestamp: Date;
  watchDuration: number; // in seconds
  completed: boolean;
}