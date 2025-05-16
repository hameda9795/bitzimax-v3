import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoService } from '../../core/services/video.service';
import { UserService } from '../../core/services/user.service';
import { Video } from '../../shared/models/video.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HomeComponent implements OnInit {
  featuredVideos: Video[] = [];
  recentVideos: Video[] = [];
  popularVideos: Video[] = [];
  baseUrl = 'http://localhost:8080';
  
  constructor(
    private videoService: VideoService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get all videos and sort them for different sections
    this.videoService.getAllVideos().subscribe(videos => {
      if (!videos || videos.length === 0) {
        console.warn('No videos found from the backend');
        return;
      }
      
      console.log('Loaded videos:', videos);
      
      // Process videos - ensure URLs start with http://localhost:8080
      videos = videos.map(video => ({
        ...video,
        thumbnailUrl: this.ensureFullUrl(video.thumbnailUrl),
        videoUrl: this.ensureFullUrl(video.videoUrl)
      }));
      
      // Get 3 featured videos (premium videos with most views)
      this.featuredVideos = [...videos]
        .filter(video => video.isPremium)
        .sort((a, b) => b.views - a.views)
        .slice(0, 3);
        
      // Get recent videos (sorted by upload date)
      this.recentVideos = [...videos]
        .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
        .slice(0, 4);
        
      // Get popular videos (sorted by likes)
      this.popularVideos = [...videos]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 4);
    });
  }

  /**
   * Make sure URL starts with the base URL
   */
  private ensureFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url.startsWith('/') 
      ? `${this.baseUrl}${url}` 
      : `${this.baseUrl}/${url}`;
  }

  /**
   * Navigate to video detail page
   */
  watchVideo(videoId: string): void {
    this.router.navigate(['/video', videoId]);
  }

  /**
   * Toggle like status for a video
   */
  toggleLike(video: Video, event: Event): void {
    event.stopPropagation(); // Prevent navigation to video
    
    this.userService.toggleVideoLike(video.id).subscribe(isLiked => {
      // If video was liked, increment like count, otherwise decrement
      if (isLiked) {
        this.videoService.likeVideo(video.id).subscribe();
      } else {
        this.videoService.unlikeVideo(video.id).subscribe();
      }
    });
  }  /**
   * Check if user has liked the video
   * Uses the current user from the userService to check if the video is in their liked videos
   */
  isLiked(videoId: string): boolean {
    // Get the current user synchronously from the BehaviorSubject value
    const currentUser = this.userService.getCurrentUserSync();
    // Check if the user exists and has the video in their liked videos list
    return currentUser && currentUser.likedVideos ? currentUser.likedVideos.includes(videoId) : false;
  }

  /**
   * Format video duration from seconds to MM:SS format
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
