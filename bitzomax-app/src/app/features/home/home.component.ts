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
  
  constructor(
    private videoService: VideoService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get all videos and sort them for different sections
    this.videoService.getAllVideos().subscribe(videos => {
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
  }

  /**
   * Check if user has liked the video
   */
  isLiked(videoId: string): boolean {
    let isLiked = false;
    this.userService.getCurrentUser().subscribe(user => {
      isLiked = user.likedVideos.includes(videoId);
    });
    return isLiked;
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
