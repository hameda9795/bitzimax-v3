import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { VideoService } from '../../core/services/video.service';
import { GenreService } from '../../core/services/genre.service';
import { UserService } from '../../core/services/user.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { UrlService } from '../../core/services/url.service';
import { Video } from '../../shared/models/video.model';
import { Genre } from '../../shared/models/genre.model';

interface GenreSidebar {
  genre: Genre;
  videos: Video[];
}

@Component({  selector: 'app-genre-page',
  templateUrl: './genre-page.component.html',
  styleUrls: ['./genre-page.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule]
})
export class GenrePageComponent implements OnInit {
  genreId: number = 0;
  genreName: string = '';
  videos: Video[] = [];
  genreSidebar: GenreSidebar[] = [];
  loading: boolean = true;
  currentGenre: Genre | null = null;
  baseUrl = 'http://localhost:8080';
  isSubscribed = false;
  
  constructor(
    private videoService: VideoService,
    private genreService: GenreService,
    private route: ActivatedRoute,
    public router: Router,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    public urlService: UrlService
  ) {}

  ngOnInit(): void {
    // Get genre ID from route params
    this.route.paramMap.subscribe(params => {
      const genreName = params.get('genreName');
      
      if (!genreName) {
        this.router.navigate(['/']);
        return;
      }

      this.genreName = genreName;
      
      // Get the genre by name
      this.genreService.genres$.subscribe(genres => {
        const genre = genres.find(g => this.urlService.createSlug(g.name) === genreName);
        
        if (!genre) {
          this.router.navigate(['/']);
          return;
        }
        
        this.currentGenre = genre;
        this.genreId = genre.id!;
        
        // Fetch videos for this genre
        this.loadGenreVideos();
        
        // Load sidebar content
        this.loadSidebarContent(genres);
        
        // Check subscription status
        this.subscriptionService.subscriptionStatus$.subscribe(isSubscribed => {
          this.isSubscribed = isSubscribed;
        });
      });
    });
  }
  
  /**
   * Load videos for the current genre
   */
  private loadGenreVideos(): void {
    this.loading = true;
    
    // Call the video service to get videos for this genre
    this.videoService.getVideosByGenre(this.genreId).subscribe({
      next: (videos) => {
        this.videos = this.processVideos(videos);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching videos by genre:', err);
        this.loading = false;
      }
    });
  }
  
  /**
   * Process videos to ensure all URLs are complete
   */
  private processVideos(videos: Video[]): Video[] {
    return videos.map(video => ({
      ...video,
      thumbnailUrl: this.ensureFullUrl(video.thumbnailUrl),
      videoUrl: this.ensureFullUrl(video.videoUrl)
    }));
  }
  
  /**
   * Generate sidebar content with videos grouped by genre
   * Exclude the current genre from the sidebar
   */
  private loadSidebarContent(genres: Genre[]): void {
    // Clear existing sidebar content
    this.genreSidebar = [];
    
    // Load videos for all genres
    this.videoService.videos$.subscribe(allVideos => {
      // Filter out non-visible videos
      const visibleVideos = allVideos.filter(video => video.isVisible);
      
      // Process each genre (except the current one)
      genres.forEach(genre => {
        // Skip the current genre
        if (genre.id === this.genreId) {
          return;
        }
        
        // Filter videos by genre
        const genreVideos = visibleVideos.filter(video => 
          video.genre && video.genre.id === genre.id
        );
        
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
              videos: latestVideos.map(video => ({
                ...video,
                thumbnailUrl: this.ensureFullUrl(video.thumbnailUrl),
                videoUrl: this.ensureFullUrl(video.videoUrl)
              }))
            });
          }
        }
      });
      
      // Limit sidebar to 5 genres max
      this.genreSidebar = this.genreSidebar.slice(0, 5);
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
      // If video was liked, increment like count, otherwise decrement
      if (isLiked) {
        video.likes++;
      } else {
        video.likes--;
      }
    });
  }

  /**
   * Check if user has liked the video
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
  
  /**
   * Navigate to a genre page
   */
  navigateToGenre(genre: Genre): void {
    const genreSlug = this.urlService.createSlug(genre.name);
    this.router.navigate(['/genre', genreSlug]);
  }
}
