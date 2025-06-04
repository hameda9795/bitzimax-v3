import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { VideoService } from '../../core/services/video.service';
import { UserService } from '../../core/services/user.service';
import { GenreService } from '../../core/services/genre.service';
import { Video } from '../../shared/models/video.model';
import { Genre } from '../../shared/models/genre.model';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { SubscriptionService } from '../../core/services/subscription.service';
import { UrlService } from '../../core/services/url.service';

interface GenreSidebar {
  genre: Genre;
  videos: Video[];
}

@Component({  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule]
})
export class HomeComponent implements OnInit {
  featuredVideos: Video[] = [];
  recentVideos: Video[] = [];
  popularVideos: Video[] = [];
  genreSidebar: GenreSidebar[] = [];
  baseUrl = 'http://localhost:8080';
  allVideos: Video[] = [];
  loadingVideos = true;
  isSubscribed = false;
  
  constructor(
    private videoService: VideoService,
    private userService: UserService,
    private genreService: GenreService,
    private router: Router,
    private subscriptionService: SubscriptionService,
    public urlService: UrlService
  ) { }

  ngOnInit(): void {
    // Subscribe to the videos observable to get all videos
    this.videoService.videos$.subscribe(videos => {
      this.allVideos = videos;
      this.filterVideos();
      this.loadingVideos = false;
    });
    
    // Load featured playlists
    this.loadFeaturedPlaylists();
    
    // Load genres
    this.loadGenres();
    
    // Check subscription status
    this.subscriptionService.subscriptionStatus$.subscribe(isSubscribed => {
      this.isSubscribed = isSubscribed;
      // Refresh video filters when subscription status changes
      this.filterVideos();
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
  watchVideo(video: Video): void {
    const slug = this.urlService.createSlug(video.title);
    this.router.navigate(['/video', video.id, slug]);
  }

  /**
   * Toggle like status for a video
   */
  toggleLike(video: Video, event: Event): void {
    event.stopPropagation(); // Prevent navigation to video

    this.userService.toggleVideoLike(video.id).subscribe(isLiked => {
      // Update local like count based on new status
      if (isLiked) {
        video.likes++;
      } else if (video.likes > 0) {
        video.likes--;
      }
    });
  }

  /**
   * Toggle favorite status for a video
   */
  toggleFavorite(video: Video, event: Event): void {
    event.stopPropagation();

    if (this.isFavorited(video.id)) {
      this.userService.removeFromFavorites(video.id).subscribe();
    } else {
      this.userService.addToFavorites(video.id).subscribe();
    }
  }

  /**
   * Check if the current user favorited the video
   */
  isFavorited(videoId: string): boolean {
    const currentUser = this.userService.getCurrentUserSync();
    return currentUser && currentUser.favoriteVideos
      ? currentUser.favoriteVideos.includes(videoId)
      : false;
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
    if (!seconds || isNaN(seconds) || seconds <= 0) {
      return '0:00';
    }
    
    // Format durations properly, accounting for hours if needed
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    } else {
      return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
  }

  private filterVideos(): void {
    // Filter out non-visible videos first
    this.allVideos = this.allVideos.filter(video => video.isVisible);
    
    // Process videos - ensure URLs start with http://localhost:8080
    this.allVideos = this.allVideos.map(video => ({
      ...video,
      thumbnailUrl: this.ensureFullUrl(video.thumbnailUrl),
      videoUrl: this.ensureFullUrl(video.videoUrl)
    }));
    
    // Get 3 featured videos (premium videos with most views)
    this.featuredVideos = [...this.allVideos]
      .filter(video => video.isPremium)
      .sort((a, b) => b.views - a.views)
      .slice(0, 3);
      
    // Get recent videos (sorted by upload date)
    this.recentVideos = [...this.allVideos]
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 6);
      
    // Get popular videos (sorted by likes)
    this.popularVideos = [...this.allVideos]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 6);
      
    // Generate sidebar content with videos grouped by genre
    this.generateSidebarContent(this.allVideos);
  }

  private loadFeaturedPlaylists(): void {
    // In a real implementation, you would load playlists from a service
    console.log('Loading featured playlists...');
    // this.playlistService.getFeaturedPlaylists().subscribe(...);
  }

  private loadGenres(): void {
    // Load genres from the genre service
    this.genreService.getAllGenres().subscribe(genres => {
      console.log('Loaded genres:', genres);
      // Any additional genre-related logic would go here
    });
  }

  /**
   * Update video duration when metadata loads
   */
  updateVideoDuration(video: Video, event: Event): void {
    const videoElement = event.target as HTMLVideoElement;
    if (videoElement && videoElement.duration && !isNaN(videoElement.duration)) {
      const actualDuration = videoElement.duration;
      
      // Only update if there's a significant difference
      if (Math.abs(video.duration - actualDuration) > 1) {
        console.log(`Updating video ${video.id} duration from ${video.duration} to ${actualDuration}`);
        
        // Update the model
        video.duration = actualDuration;
        
        // Update in the service to persist to backend
        // Use skipRefresh=true to avoid unneeded refreshes
        this.videoService.updateVideoDuration(video.id, actualDuration, true);
      }
    }
  }
}
