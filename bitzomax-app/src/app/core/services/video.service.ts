import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpParams, HttpRequest } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, catchError, map, tap } from 'rxjs';
import { Video } from '../../shared/models/video.model';
import { PageRequest, PageResponse } from '../../shared/models/pagination.model';

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

  constructor(private http: HttpClient) { }

  // Helper method to ensure URLs are absolute
  private ensureAbsoluteUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${this.baseUrl}${url}`;
    return `${this.baseUrl}/${url}`;
  }

  /**
   * Get all videos with pagination
   */
  getVideos(pageRequest: PageRequest = { page: 0, size: 10 }): Observable<PageResponse<Video>> {
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
    
    return this.http.get<VideoPageResponse>(`${this.apiUrl}/page`, { params })
      .pipe(
        map((response: VideoPageResponse): PageResponse<Video> => ({
          ...response,
          content: response.content.map((video: VideoResponse): Video => ({
            ...video,
            thumbnailUrl: this.ensureAbsoluteUrl(video.thumbnailUrl),
            videoUrl: this.ensureAbsoluteUrl(video.videoUrl),
            uploadDate: new Date(video.uploadDate),
            duration: video.duration || 0
          }))
        })),
        tap((): void => this.loadingSubject.next(false)),
        catchError((error: HttpErrorResponse) => this.handleError(error))
      );
  }
  
  /**
   * Get all videos (non-paginated, for backwards compatibility)
   */
  getAllVideos(): Observable<Video[]> {
    this.loadingSubject.next(true);
    return this.http.get<VideoResponse[]>(this.apiUrl)
      .pipe(
        map((videos: VideoResponse[]): Video[] => {
          // Convert date strings to Date objects
          return videos.map((video: VideoResponse): Video => ({
            ...video,
            uploadDate: new Date(video.uploadDate)
          }));
        }),
        tap((): void => this.loadingSubject.next(false)),
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
          uploadDate: new Date(video.uploadDate)
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
          uploadDate: new Date(video.uploadDate)
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
        map((video: VideoResponse): Video => ({
          ...video,
          uploadDate: new Date(video.uploadDate)
        })),
        tap((): void => this.loadingSubject.next(false)),
        catchError((error: HttpErrorResponse) => {
          // For 404 errors, return undefined instead of throwing
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
          uploadDate: new Date(video.uploadDate)
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
    formData.append('videoData', JSON.stringify(videoData));
    
    const req = new HttpRequest('POST', `${this.apiUrl}/upload`, formData, {
      reportProgress: true
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
        uploadDate: new Date(video.uploadDate)
      })),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating video metadata:', error);
        return of(undefined);
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
}
