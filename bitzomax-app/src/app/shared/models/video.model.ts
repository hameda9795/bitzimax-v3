import { Genre } from './genre.model';

/**
 * Video model interface for the Bitzomax platform
 */
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // in seconds
  views: number;
  likes: number;
  isPremium: boolean;
  uploadDate: Date;
  tags?: string[];
  commentCount: number;
  shareCount: number;
  isVisible: boolean;
  
  // Additional fields for admin panel
  poemText?: string;       // Poem text associated with the video
  hashtags?: string[];     // Hashtags for better categorization
  seoTitle?: string;       // SEO optimized title
  seoDescription?: string; // SEO optimized description
  seoKeywords?: string[];  // SEO keywords
  originalFormat?: string; // Original video format before conversion
  conversionStatus?: string;
  engagementRate?: number; // Calculated engagement metric
  genre?: Genre;
}

/**
 * Video Analytics model for dashboard stats
 */
export interface VideoAnalytics {
  videoId: string;
  viewsOverTime: {date: Date, count: number}[];
  likesOverTime: {date: Date, count: number}[];
  commentsOverTime: {date: Date, count: number}[];
  averageWatchTime: number;
  engagementRate: number;
  conversionRate?: number; // For premium videos
}

/**
 * Video comment model
 */
export interface VideoComment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: Date;
  likes: number;
}

export interface VideoUploadResponse {
  success: boolean;
  message: string;
  video?: Video;
}

export interface VideoSearchParams {
  page: number;
  size: number;
  sort: string;
  direction: string;
  query?: string;
  genre?: string;
  tags?: string[];
  isPremium?: boolean;
}