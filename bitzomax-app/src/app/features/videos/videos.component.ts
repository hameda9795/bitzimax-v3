import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Video } from '../../shared/models/video.model';
import { Genre } from '../../shared/models/genre.model';
import { VideoService } from '../../core/services/video.service';
import { GenreService } from '../../core/services/genre.service';
import { UserService } from '../../core/services/user.service';
import { UrlService } from '../../core/services/url.service';
import { SubscriptionService } from '../../core/services/subscription.service';

interface GenreVideosGroup {
  genre: Genre;
  videos: Video[];
}

@Component({
  selector: 'app-videos',
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule]
})
export class VideosComponent implements OnInit {
  loading = true;
  allVideos: Video[] = [];
  genreGroups: GenreVideosGroup[] = [];
  latestVideos: Video[] = [];
  popularVideos: Video[] = [];
  baseUrl = 'http://localhost:8080';
  isSubscribed = false;

  constructor(
    private videoService: VideoService,
    private genreService: GenreService,
    private userService: UserService,
    private router: Router,
    private subscriptionService: SubscriptionService,
    public urlService: UrlService
  ) { }

  ngOnInit(): void {
    // Load all videos
    this.videoService.videos$.subscribe(videos => {
      this.allVideos = this.filterVisibleVideos(videos);
      this.organizeVideosByGenre();
      this.organizeLatestAndPopularVideos();
      this.loading = false;
    });

    // Check subscription status
    this.subscriptionService.subscriptionStatus$.subscribe(isSubscribed => {
      this.isSubscribed = isSubscribed;
    });
  }

  /**
   * Filter visible videos
   */
  private filterVisibleVideos(videos: Video[]): Video[] {
    return videos
      .filter(video => video.isVisible)
      .map(video => ({
        ...video,
        thumbnailUrl: this.ensureFullUrl(video.thumbnailUrl),
        videoUrl: this.ensureFullUrl(video.videoUrl)
      }));
  }

  /**
   * Organize videos by genre
   */
  private organizeVideosByGenre(): void {
    this.genreService.genres$.subscribe(genres => {
      this.genreGroups = [];
      
      // For each genre, get videos
      genres.forEach(genre => {
        if (!genre.id) return;
        
        // Filter videos for this genre
        const genreVideos = this.allVideos.filter(
          video => video.genre && video.genre.id === genre.id
        );
        
        // Only add genres with videos
        if (genreVideos.length > 0) {
          this.genreGroups.push({
            genre,
            videos: genreVideos.slice(0, 4) // Limit to 4 videos per genre
          });
        }
      });
    });
  }

  /**
   * Organize latest and popular videos for the sidebar
   */
  private organizeLatestAndPopularVideos(): void {
    // Get recent videos (sorted by upload date)
    this.latestVideos = [...this.allVideos]
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
      .slice(0, 5);
    
    // Get popular videos (sorted by views)
    this.popularVideos = [...this.allVideos]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
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
   * Format video duration from seconds to MM:SS format
   */
  formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Navigate to genre page
   */
  navigateToGenre(genre: Genre): void {
    const genreSlug = this.urlService.createSlug(genre.name);
    this.router.navigate(['/genre', genreSlug]);
  }
}
