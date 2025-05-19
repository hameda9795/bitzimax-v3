import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpParams, HttpRequest, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, catchError, map, tap } from 'rxjs';
import { Video } from '../../shared/models/video.model';
import { PageRequest, PageResponse } from '../../shared/models/pagination.model';
import { UrlService } from './url.service';

// Backend API response interfaces
interface VideoResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number;
  views: number;
  likes: number;
  isPremium: boolean;
  uploadDate: string;
  tags: string[];
  poemText?: string;
  hashtags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  originalFormat?: string;
  conversionStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  engagementRate?: number;
  commentCount?: number;
  shareCount?: number;
  isVisible?: boolean;
  genre?: {
    id: number;
    name: string;
    description?: string;
  };
}

interface VideoPageResponse {
  content: VideoResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

interface LikeResponse {
  success: boolean;
}

interface UploadProgressInfo {
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'http://localhost:8080/api/videos';
  private baseUrl = 'http://localhost:8080';
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private currentVideoSubject = new BehaviorSubject<Video | null>(null);
  public currentVideo$ = this.currentVideoSubject.asObservable();
  
  private uploadProgressSubject = new BehaviorSubject<UploadProgressInfo>({
    progress: 0,
    status: 'pending'
  });
  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  private videosSubject = new BehaviorSubject<Video[]>([]);
  public videos$ = this.videosSubject.asObservable();

  constructor(private http: HttpClient, private urlService: UrlService) {
    console.log('VideoService initialized with API URL:', this.apiUrl);
    
    // Verify API URL is accessible
    this.checkApiHealth();
    
    // Load videos initially
    this.loadVideos();
  }
  /**   * Get videos by genre ID
   * @param genreId The ID of the genre to filter by
   * @returns Observable of videos belonging to the specified genre
   */
  getVideosByGenre(genreId: number): Observable<Video[]> {
    this.loadingSubject.next(true);
    return this.http.get<VideoResponse[]>(`${this.apiUrl}/genre/${genreId}`)
      .pipe(
        map((videos: VideoResponse[]): Video[] => {
          return videos.map(video => this.convertVideoResponse(video));
        }),
        tap(videos => {
          console.log(`Fetched ${videos.length} videos for genre ID ${genreId}`);
          this.loadingSubject.next(false);
        }),
        catchError(error => {
          this.loadingSubject.next(false);
          console.error(`Error fetching videos for genre ${genreId}:`, error);
          return of([]);
        })
      );
  }

  /**
   * Check if the API is accessible
   */
  private checkApiHealth(): void {
    this.http.get(`${this.apiUrl}`, { observe: 'response' })
      .pipe(
        catchError(error => {
          console.error('API health check failed:', error);
          return of({ status: error.status || 0, statusText: error.statusText || 'Unknown error' });
        })
      )
      .subscribe(response => {
        if (response.status === 200) {
          console.log('API health check successful');
        } else {
          console.error('API health check failed:', response.status, response.statusText);
          alert('Warning: Cannot connect to video API. Please check if the backend server is running at ' + this.apiUrl);
        }
      });
  }

  /**
   * Load all videos from the backend
   */
  private loadVideos(): void {
    this.getAllVideos().subscribe(videos => {
      this.videosSubject.next(videos);
    });
  }

  /**
   * Refresh the videos list
   */
  public refreshVideos(): void {
    this.loadVideos();
  }

  /**
   * Ensure a URL is absolute
   */
  private ensureFullUrl(url: string): string {
    if (!url) return '';
    
    // If the URL is already absolute, return it as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Handle both /videos/ and /uploads/videos/ paths
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    
    // If the URL doesn't start with /uploads/ and contains /videos/, add /uploads
    if (!url.startsWith('/uploads/') && url.includes('/videos/')) {
      url = '/uploads' + url;
    }
    
    // Replace assets/videos with /uploads/videos
    url = url.replace('assets/videos', '/uploads/videos');
    
    return `${this.baseUrl}${url}`;
  }

  /**
   * Get all videos with pagination
   */
  getVideos(pageRequest: PageRequest = { page: 0, size: 10 }): Observable<PageResponse<Video>> {
    console.log('VideoService.getVideos called with pageRequest:', pageRequest);
    this.loadingSubject.next(true);
    
    let params = new HttpParams()
      .set('page', pageRequest.page.toString())
      .set('size', pageRequest.size.toString());
      
    if (pageRequest.sort) {
      params = params.set('sort', pageRequest.sort);
      if (pageRequest.direction) {
        params = params.set('direction', pageRequest.direction);
      }
    }
    
    if (pageRequest.filter) {
      params = params.set('filter', pageRequest.filter);
    }
    
    if (pageRequest.filterType) {
      params = params.set('filterType', pageRequest.filterType);
    }
    
    console.log('Making request to:', `${this.apiUrl}/page`, 'with params:', params.toString());
    
    return this.http.get<VideoPageResponse>(`${this.apiUrl}/page`, { params })
      .pipe(
        tap(response => console.log('Raw API response:', response)),
        map((response: VideoPageResponse): PageResponse<Video> => ({
          ...response,
          content: response.content.map((video: VideoResponse): Video => this.convertVideoResponse(video))
        })),
        tap((result): void => {
          console.log('Mapped response:', result);
          this.loadingSubject.next(false);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching videos:', error);
          return this.handleError(error);
        })
      );
  }
  
  private convertVideoResponse(video: VideoResponse): Video {
    // Ensure valid date or use current date as fallback
    let uploadDate: Date;
    try {
      uploadDate = video.uploadDate ? new Date(video.uploadDate) : new Date();
      // Check if date is valid
      if (isNaN(uploadDate.getTime())) {
        uploadDate = new Date();
      }
    } catch (e) {
      uploadDate = new Date();
    }

    // Keep the original duration from the backend if it's valid
    // Only use default duration if the backend value is truly invalid
    let duration = 30; // Default fallback
    if (typeof video.duration === 'number') {
      // Even very small durations might be valid (like 1 second videos)
      duration = video.duration > 0 ? video.duration : 30;
    }

    return {
      ...video,
      uploadDate: uploadDate,
      thumbnailUrl: this.ensureFullUrl(video.thumbnailUrl),
      videoUrl: this.ensureFullUrl(video.videoUrl),
      duration: duration,
      isVisible: video.isVisible !== undefined ? video.isVisible : true,
      commentCount: video.commentCount || 0,
      shareCount: video.shareCount || 0
    };
  }
  /**
   * Get all videos (non-paginated)
   */
  getAllVideos(): Observable<Video[]> {
    this.loadingSubject.next(true);
    return this.http.get<any>(this.apiUrl)
      .pipe(
        map((response: any): Video[] => {
          // Handle both array response and paginated response with content field
          const videos = Array.isArray(response) ? response : (response.content || []);
          return videos.map((video: VideoResponse) => this.convertVideoResponse(video));
        }),
        tap((videos: Video[]): void => {
          console.log('Loaded videos:', videos);
          this.loadingSubject.next(false);
        }),
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  /**
   * Get premium videos with pagination
   */
  getPremiumVideos(pageRequest: PageRequest = { page: 0, size: 10 }): Observable<PageResponse<Video>> {
    pageRequest.filterType = 'premium';
    return this.getVideos(pageRequest);
  }
  
  /**
   * Get premium videos (non-paginated, for backwards compatibility)
   */
  getAllPremiumVideos(): Observable<Video[]> {
    this.loadingSubject.next(true);
    return this.http.get<VideoResponse[]>(`${this.apiUrl}/premium`)
      .pipe(
        map((videos: VideoResponse[]): Video[] => videos.map((video: VideoResponse): Video => ({
          ...video,
          uploadDate: new Date(video.uploadDate),
          isVisible: video.isVisible !== undefined ? video.isVisible : true,
          commentCount: video.commentCount || 0,
          shareCount: video.shareCount || 0
        }))),
        tap((): void => this.loadingSubject.next(false)),
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  /**
   * Get free videos with pagination
   */
  getFreeVideos(pageRequest: PageRequest = { page: 0, size: 10 }): Observable<PageResponse<Video>> {
    pageRequest.filterType = 'free';
    return this.getVideos(pageRequest);
  }
  
  /**
   * Get free videos (non-paginated, for backwards compatibility)
   */
  getAllFreeVideos(): Observable<Video[]> {
    this.loadingSubject.next(true);
    return this.http.get<VideoResponse[]>(`${this.apiUrl}/free`)
      .pipe(
        map((videos: VideoResponse[]): Video[] => videos.map((video: VideoResponse): Video => ({
          ...video,
          uploadDate: new Date(video.uploadDate),
          isVisible: video.isVisible !== undefined ? video.isVisible : true,
          commentCount: video.commentCount || 0,
          shareCount: video.shareCount || 0
        }))),
        tap((): void => this.loadingSubject.next(false)),
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }

  /**
   * Get video by ID
   */
  getVideoById(id: string): Observable<Video | undefined> {
    this.loadingSubject.next(true);
    return this.http.get<VideoResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map((video: VideoResponse): Video => this.convertVideoResponse(video)),
        tap((): void => this.loadingSubject.next(false)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.loadingSubject.next(false);
            return of(undefined);
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Set current video
   */
  setCurrentVideo(videoId: string): void {
    this.getVideoById(videoId).subscribe({
      next: (video: Video | undefined): void => this.currentVideoSubject.next(video || null),
      error: (error: Error): void => {
        console.error('Error setting current video:', error);
        this.currentVideoSubject.next(null);
      }
    });
  }

  /**
   * Like a video
   */
  likeVideo(videoId: string): Observable<boolean> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/${videoId}/like`, {})
      .pipe(
        map((): boolean => true),
        catchError((error: HttpErrorResponse): Observable<boolean> => {
          console.error('Error liking video:', error);
          return of(false);
        })
      );
  }

  /**
   * Unlike a video
   */
  unlikeVideo(videoId: string): Observable<boolean> {
    return this.http.post<LikeResponse>(`${this.apiUrl}/${videoId}/unlike`, {})
      .pipe(
        map((): boolean => true),
        catchError((error: HttpErrorResponse): Observable<boolean> => {
          console.error('Error unliking video:', error);
          return of(false);
        })
      );
  }

  /**
   * Get related videos by tags (excluding the current video)
   */
  getRelatedVideos(videoId: string, limit: number = 3): Observable<Video[]> {
    this.loadingSubject.next(true);
    return this.http.get<VideoResponse[]>(`${this.apiUrl}/${videoId}/related?limit=${limit}`)
      .pipe(
        map((videos: VideoResponse[]): Video[] => videos.map((video: VideoResponse): Video => ({
          ...video,
          uploadDate: new Date(video.uploadDate),
          isVisible: video.isVisible !== undefined ? video.isVisible : true,
          commentCount: video.commentCount || 0,
          shareCount: video.shareCount || 0
        }))),
        tap((): void => this.loadingSubject.next(false)),
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }
  /**
   * Upload a video with progress tracking
   */  
  uploadVideo(videoFile: File, thumbnailFile: File, videoData: Partial<Video>): Observable<HttpEvent<any>> {
    this.uploadProgressSubject.next({
      progress: 0,
      status: 'uploading',
      message: 'Uploading video...'
    });
    
    const formData = new FormData();
    
    if (videoFile) {
      formData.append('videoFile', videoFile);
    }
    
    formData.append('thumbnailFile', thumbnailFile);
    
    // Clean up undefined values before serializing
    const cleanVideoData = Object.entries(videoData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        // Using type assertion to bypass TypeScript's indexing restriction
        (acc as any)[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Log the data being sent for debugging
    console.log('Sending video data:', cleanVideoData);
    formData.append('videoData', JSON.stringify(cleanVideoData));
    
    // Get the current user ID for the X-User-ID header
    // Mock user ID for now - in a real app, you would get this from authentication service
    const userId = localStorage.getItem('userId') || '1'; 
    
    // Create headers with the X-User-ID
    const headers = new HttpHeaders().set('X-User-ID', userId);
    
    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      headers: headers
    });
    
    return this.http.request(req).pipe(
      tap((event: HttpEvent<any>): void => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * event.loaded / event.total);
          this.uploadProgressSubject.next({
            progress,
            status: 'uploading',
            message: `Uploaded ${progress}%`
          });
        } else if (event.type === HttpEventType.Response) {
          this.uploadProgressSubject.next({
            progress: 100,
            status: 'complete',
            message: 'Upload complete!'
          });
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.uploadProgressSubject.next({
          progress: 0,
          status: 'error',
          message: error.message
        });
        return this.handleError(error);
      })
    );
  }
  
  /**
   * Delete a video
   */
  deleteVideo(videoId: string): Observable<boolean> {
    return this.http.delete<void>(`${this.apiUrl}/${videoId}`).pipe(
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting video:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Bulk delete videos
   */
  bulkDeleteVideos(videoIds: string[]): Observable<boolean> {
    return this.http.post<void>(`${this.apiUrl}/bulk-delete`, { ids: videoIds }).pipe(
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error bulk deleting videos:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Update video premium status
   */
  updatePremiumStatus(videoId: string, isPremium: boolean): Observable<boolean> {
    return this.http.patch<void>(`${this.apiUrl}/${videoId}/premium`, { isPremium }).pipe(
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating premium status:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Bulk update premium status
   */
  bulkUpdatePremiumStatus(videoIds: string[], isPremium: boolean): Observable<boolean> {
    return this.http.post<void>(`${this.apiUrl}/bulk-premium`, { ids: videoIds, isPremium }).pipe(
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error bulk updating premium status:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Update video metadata
   */
  updateVideoMetadata(videoId: string, videoData: Partial<Video>): Observable<Video | undefined> {
    return this.http.put<VideoResponse>(`${this.apiUrl}/${videoId}`, videoData).pipe(
      map((video: VideoResponse): Video => ({
        ...video,
        uploadDate: new Date(video.uploadDate),
        isVisible: video.isVisible !== undefined ? video.isVisible : true,
        commentCount: video.commentCount || 0,
        shareCount: video.shareCount || 0
      })),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating video metadata:', error);
        return of(undefined);
      })
    );
  }
  
  /**
   * Track video share
   */
  trackShare(videoId: string): Observable<boolean> {
    return this.http.post<void>(`${this.apiUrl}/${videoId}/share`, {}).pipe(
      map(() => true),
      catchError((error: HttpErrorResponse) => {
        console.error('Error tracking share:', error);
        return of(false);
      })
    );
  }

  /**
   * Reset upload progress
   */
  resetUploadProgress(): void {
    this.uploadProgressSubject.next({
      progress: 0,
      status: 'pending'
    });
  }
  
  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    this.loadingSubject.next(false);
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError((): Error => new Error(errorMessage));
  }

  /**
   * Update video duration when actual duration is detected in HTML video element
   */
  updateVideoDuration(videoId: string, actualDuration: number, skipRefresh: boolean = false): void {
    // First update the video in the dataSource if it exists
    const videos = this.videosSubject.getValue();
    const videoIndex = videos.findIndex(v => v.id === videoId);
    
    if (videoIndex !== -1) {
      // Log the update regardless of whether there's a significant difference
      console.log(`Updating video ${videoId} duration from ${videos[videoIndex].duration} to ${actualDuration}`);
      
      // Create a new array with the updated video
      const updatedVideos = [...videos];
      updatedVideos[videoIndex] = {
        ...updatedVideos[videoIndex],
        duration: actualDuration
      };
      
      // Update the videos subject so all components show the accurate duration
      // Only if skipRefresh is false (to avoid loops)
      if (!skipRefresh) {
        this.videosSubject.next(updatedVideos);
      }
      
      // Update the duration in the backend with metadata flag
      this.http.patch(`${this.apiUrl}/${videoId}/duration`, {
        duration: actualDuration,
        isFromMetadata: true  // Flag to indicate this is from actual video metadata
      })
      .subscribe({
        next: () => console.log(`Video ${videoId} duration updated in backend`),
        error: (error) => console.error(`Error updating video duration:`, error)
      });
    } else {
      console.log(`Video ${videoId} not found in videos cache`);
    }
    
    // If this is the current video, update it as well
    const currentVideo = this.currentVideoSubject.getValue();
    if (currentVideo && currentVideo.id === videoId) {
      this.currentVideoSubject.next({
        ...currentVideo,
        duration: actualDuration
      });
    }
  }

  getShareUrl(video: Video): string {
    const slug = this.urlService.createSlug(video.title);
    return `${window.location.origin}/video/${video.id}/${slug}`;
  }
}
