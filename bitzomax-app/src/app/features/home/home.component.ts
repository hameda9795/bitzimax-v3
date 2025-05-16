import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VideoService } from '../../core/services/video.service';
import { UserService } from '../../core/services/user.service';
import { GenreService } from '../../core/services/genre.service';
import { Video } from '../../shared/models/video.model';
import { Genre } from '../../shared/models/genre.model';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface GenreSidebar {
  genre: Genre;
  videos: Video[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule]
})
export class HomeComponent implements OnInit {
  featuredVideos: Video[] = [];
  recentVideos: Video[] = [];
  popularVideos: Video[] = [];
  genreSidebar: GenreSidebar[] = [];
  baseUrl = 'http://localhost:8080';
  
  constructor(
    private videoService: VideoService,
    private userService: UserService,
    private genreService: GenreService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to the video stream
    this.videoService.videos$.subscribe(videos => {
      if (!videos || videos.length === 0) {
        console.warn('No videos found from the backend');
        return;
      }
      
      console.log('Loaded videos:', videos);
      
      // Filter out non-visible videos first
      videos = videos.filter(video => video.isVisible);
      
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
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 6);
        
      // Get popular videos (sorted by likes)
      this.popularVideos = [...videos]
        .sort((a, b) => b.likes - a.likes)
        .slice(0, 6);
        
      // Generate sidebar content with videos grouped by genre
      this.generateSidebarContent(videos);
    });
  }
  
  /**
   * Generate sidebar content with videos grouped by genre
   */
  private generateSidebarContent(videos: Video[]): void {
    this.genreService.genres$.subscribe(genres => {
      // Clear existing sidebar content
      this.genreSidebar = [];
      
      console.log('Loaded genres for sidebar:', genres);
      console.log('Videos with genres:', videos.map(v => ({ 
        id: v.id, 
        title: v.title, 
        genreId: v.genre?.id, 
        genreName: v.genre?.name 
      })));
      
      // For each genre, get the 4 latest videos
      genres.forEach(genre => {
        // Filter videos by current genre
        const genreVideos = videos.filter(video => 
          video.genre && video.genre.id === genre.id
        );
        
        console.log(`Genre ${genre.name} has ${genreVideos.length} videos`);
        
        // Only add genre to sidebar if it has videos
        if (genreVideos.length > 0) {
          // Sort by upload date (newest first) and take top 4
          const latestVideos = [...genreVideos]
            .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
            .slice(0, 4);
          
          // Add to sidebar if there are videos
          if (latestVideos.length > 0) {
            this.genreSidebar.push({
              genre,
              videos: latestVideos
            });
          }
        }
      });
      
      console.log('Generated genre sidebar content:', this.genreSidebar);
      
      // Limit sidebar to 8 genres max
      this.genreSidebar = this.genreSidebar.slice(0, 8);
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
  }

  /**
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
