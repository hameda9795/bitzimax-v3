import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Video } from '../../shared/models/video.model';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  // Mock videos data
  private videos: Video[] = [
    {
      id: 'v1',
      title: 'Neon Dystopia',
      description: 'Experience the dystopian future with this mind-bending visual journey through the streets of Neo-Tokyo.',
      thumbnailUrl: 'https://via.placeholder.com/320x640/0a0014/00ff9f?text=Neon+Dystopia',
      videoUrl: 'assets/videos/sample-video-1.mp4',
      duration: 180, // 3 minutes
      views: 2400,
      likes: 243,
      isPremium: true,
      uploadDate: new Date('2025-04-15'),
      tags: ['cyberpunk', 'dystopia', 'neon']
    },
    {
      id: 'v2',
      title: 'Digital Dreams',
      description: 'Dive into a world where reality meets digital existence, blurring the lines between what\'s real and what\'s code.',
      thumbnailUrl: 'https://via.placeholder.com/320x640/0a0014/00e1ff?text=Digital+Dreams',
      videoUrl: 'assets/videos/sample-video-2.mp4',
      duration: 225, // 3:45 minutes
      views: 3800,
      likes: 517,
      isPremium: true,
      uploadDate: new Date('2025-04-20'),
      tags: ['cyberpunk', 'digital', 'reality']
    },
    {
      id: 'v3',
      title: 'Synthetic Reality',
      description: 'When synthetic beings challenge what we know as reality, the line between human and machine becomes increasingly blurred.',
      thumbnailUrl: 'https://via.placeholder.com/320x640/0a0014/ff0080?text=Synthetic+Reality',
      videoUrl: 'assets/videos/sample-video-3.mp4',
      duration: 257, // 4:17 minutes
      views: 5200,
      likes: 742,
      isPremium: true,
      uploadDate: new Date('2025-05-01'),
      tags: ['cyberpunk', 'synthetic', 'reality']
    },
    {
      id: 'v4',
      title: 'Cyber Revolution: Episode 1',
      description: 'In this episode, we explore the beginnings of the cyber revolution and how it transformed society into the neon-lit dystopia we experience today.',
      thumbnailUrl: 'https://via.placeholder.com/320x640/0a0014/00ff9f?text=Cyber+Revolution+1',
      videoUrl: 'assets/videos/sample-video-4.mp4',
      duration: 360, // 6 minutes
      views: 24600,
      likes: 3104,
      isPremium: true,
      uploadDate: new Date('2025-03-10'),
      tags: ['cyberpunk', 'revolution', 'series']
    },
    {
      id: 'v5',
      title: 'Cyber Revolution: Episode 2',
      description: 'The rise of artificial intelligence and its impact on society, governance, and human identity.',
      thumbnailUrl: 'https://via.placeholder.com/320x640/0a0014/00e1ff?text=Cyber+Revolution+2',
      videoUrl: 'assets/videos/sample-video-5.mp4',
      duration: 374, // 6:14 minutes
      views: 12300,
      likes: 1856,
      isPremium: true,
      uploadDate: new Date('2025-03-25'),
      tags: ['cyberpunk', 'revolution', 'AI', 'series']
    },
    {
      id: 'v6',
      title: 'Digital Rebellion: The Hackers',
      description: 'How hackers changed the digital landscape and became the new revolutionaries in a world dominated by megacorporations.',
      thumbnailUrl: 'https://via.placeholder.com/320x640/0a0014/ff0080?text=Digital+Rebellion',
      videoUrl: 'assets/videos/sample-video-6.mp4',
      duration: 298, // 4:58 minutes
      views: 18500,
      likes: 2784,
      isPremium: true,
      uploadDate: new Date('2025-04-05'),
      tags: ['cyberpunk', 'hackers', 'digital', 'rebellion']
    },
    {
      id: 'v7',
      title: 'Neon City Nights',
      description: 'Experience the cyberpunk nightlife in the heart of Neon City, where danger and excitement lurk around every corner.',
      thumbnailUrl: 'https://via.placeholder.com/320x640/0a0014/00e1ff?text=Neon+City+Nights',
      videoUrl: 'assets/videos/sample-video-7.mp4',
      duration: 245, // 4:05 minutes
      views: 9700,
      likes: 1532,
      isPremium: false, // Free content
      uploadDate: new Date('2025-05-07'),
      tags: ['cyberpunk', 'nightlife', 'neon']
    }
  ];

  private currentVideoSubject = new BehaviorSubject<Video | null>(null);
  public currentVideo$ = this.currentVideoSubject.asObservable();

  constructor() { }
  
  /**
   * Get all videos
   */
  getAllVideos(): Observable<Video[]> {
    return of(this.videos);
  }

  /**
   * Get premium videos
   */
  getPremiumVideos(): Observable<Video[]> {
    return of(this.videos.filter(video => video.isPremium));
  }

  /**
   * Get free videos
   */
  getFreeVideos(): Observable<Video[]> {
    return of(this.videos.filter(video => !video.isPremium));
  }

  /**
   * Get video by ID
   */
  getVideoById(id: string): Observable<Video | undefined> {
    const video = this.videos.find(v => v.id === id);
    return of(video);
  }

  /**
   * Set current video
   */
  setCurrentVideo(videoId: string): void {
    const video = this.videos.find(v => v.id === videoId);
    this.currentVideoSubject.next(video || null);
  }

  /**
   * Like a video
   */
  likeVideo(videoId: string): Observable<boolean> {
    const video = this.videos.find(v => v.id === videoId);
    if (video) {
      video.likes++;
      return of(true);
    }
    return of(false);
  }

  /**
   * Unlike a video
   */
  unlikeVideo(videoId: string): Observable<boolean> {
    const video = this.videos.find(v => v.id === videoId);
    if (video && video.likes > 0) {
      video.likes--;
      return of(true);
    }
    return of(false);
  }

  /**
   * Get related videos by tags (excluding the current video)
   */
  getRelatedVideos(videoId: string, limit: number = 3): Observable<Video[]> {
    const currentVideo = this.videos.find(v => v.id === videoId);
    
    if (!currentVideo) {
      return of([]);
    }

    // Find videos with similar tags
    const relatedVideos = this.videos
      .filter(v => v.id !== videoId) // Exclude current video
      .map(video => {
        const commonTags = video.tags.filter(tag => currentVideo.tags.includes(tag));
        return {
          video,
          relevance: commonTags.length
        };
      })
      .filter(item => item.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .map(item => item.video)
      .slice(0, limit);

    return of(relatedVideos);
  }
}
