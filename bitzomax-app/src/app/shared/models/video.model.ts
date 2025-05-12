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
  tags: string[];
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