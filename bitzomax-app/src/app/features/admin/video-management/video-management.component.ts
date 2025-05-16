import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil, Subscription, BehaviorSubject, skip, finalize } from 'rxjs';

import { VideoService } from '../../../core/services/video.service';
import { Video } from '../../../shared/models/video.model';
import { PageRequest, PageResponse } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-video-management',
  templateUrl: './video-management.component.html',
  styleUrls: ['./video-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink
  ]
})
export class VideoManagementComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'select', 'thumbnail', 'title', 'uploadDate', 'views', 
    'likes', 'premium', 'actions'
  ];
  dataSource = new MatTableDataSource<Video>([]);
  selection = new SelectionModel<Video>(true, []);
  isLoading = true;
  totalVideos = 0;
  selectedFilter: 'all' | 'premium' | 'free' = 'all';
  searchQuery = '';
  loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  
  // Responsive columns configuration
  displayedColumnsMobile: string[] = ['thumbnail', 'title', 'actions'];
  displayedColumnsTablet: string[] = ['select', 'thumbnail', 'title', 'premium', 'actions'];
  currentDisplayColumns: string[] = this.displayedColumns;
  
  // Pagination parameters
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Used for server-side pagination
  currentPageResponse: PageResponse<Video> | null = null;
  
  // Subject for handling unsubscribe on destroy
  private destroy$ = new Subject<void>();
  private resizeObserver: ResizeObserver;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private subscriptions = new Subscription();

  constructor(
    private videoService: VideoService,
    private dialog: MatDialog,
    private router: Router
  ) {
    // Initialize ResizeObserver for responsive layout
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.adjustColumnsByScreenSize(entry.contentRect.width);
      }
    });
  }

  ngOnInit(): void {
    this.loadingSubject.next(true);
    
    // Direct test to check API connectivity
    console.log('Testing direct API call to check server health...');
    fetch('http://localhost:8080/api/videos')
      .then(response => {
        console.log('API response status:', response.status);
        if (response.ok) {
          response.json().then(data => {
            console.log('Direct API fetch successful, videos found:', data.length);
          });
        } else {
          console.error('API responded with error:', response.status);
        }
      })
      .catch(error => {
        console.error('Failed to connect to API, server may be down:', error);
      });
    
    // Subscribe to video service for updates, but only refresh if 
    // it's an explicit update, not from our own loadVideos call
    this.subscriptions.add(
      this.videoService.videos$.pipe(
        // Skip the first emission which happens on subscription
        // to avoid duplicate initial loading
        skip(1)
      ).subscribe(() => {
        // Only reload if not already loading to prevent loops
        if (!this.isLoading) {
          this.loadVideos();
        }
      })
    );
    
    // Initial data load
    this.loadVideos();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.resizeObserver.disconnect();
    this.subscriptions.unsubscribe();
  }

  private adjustColumnsByScreenSize(width: number): void {
    if (width < 600) {
      this.currentDisplayColumns = this.displayedColumnsMobile;
    } else if (width < 960) {
      this.currentDisplayColumns = this.displayedColumnsTablet;
    } else {
      this.currentDisplayColumns = this.displayedColumns;
    }
  }

  ngAfterViewInit(): void {
    // Set up sorting
    this.dataSource.sort = this.sort;
    
    // Set up pagination
    this.paginator.page.subscribe(() => {
      this.loadVideos();
    });
    
    // Start observing the table container for size changes
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      this.resizeObserver.observe(tableContainer);
    }
  }

  loadVideos(sortField?: string, sortDirection?: 'asc' | 'desc' | '') {
    console.log('loadVideos called, current loading state:', this.isLoading);
    
    // Even if already loading, we'll force a reset after 5 seconds to prevent permanent loading
    if (this.isLoading) {
      setTimeout(() => {
        if (this.isLoading) {
          console.log('Force-resetting loading state after timeout');
          this.isLoading = false;
          this.loadingSubject.next(false);
        }
      }, 5000);
      console.log('Already loading videos, request ignored');
      return;
    }
    
    this.isLoading = true;
    this.loadingSubject.next(true);
    
    // Create page request with current pagination, sorting and filtering
    const pageRequest: PageRequest = {
      page: this.pageIndex,
      size: this.pageSize
    };
    
    // Add sorting if specified
    if (sortField && sortDirection) {
      pageRequest.sort = sortField;
      pageRequest.direction = sortDirection as 'asc' | 'desc';
    }
    
    // Add search filter if any
    if (this.searchQuery) {
      pageRequest.filter = this.searchQuery;
    }
    
    // Add type filter if not "all"
    if (this.selectedFilter !== 'all') {
      pageRequest.filterType = this.selectedFilter;
    }
    
    console.log('Loading videos with request:', pageRequest);
    
    // Add direct error handling to force reset loading state
    try {
      // Call API with the page request
      this.videoService.getVideos(pageRequest)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            console.log('finalize called, resetting loading state');
            this.isLoading = false;
            this.loadingSubject.next(false);
          })
        )
        .subscribe({
          next: (page: PageResponse<Video>) => {
            console.log('Received video response:', page);
            this.currentPageResponse = page;
            this.dataSource.data = page.content;
            this.totalVideos = page.totalElements;
            console.log('Loaded videos successfully:', page.content.length);
            
            // Reset selection when loading new data
            this.selection.clear();
          },
          error: (error) => {
            console.error('Error loading videos:', error);
            this.dataSource.data = [];
            this.totalVideos = 0;
            alert('Failed to load videos. Please try again.');
          }
        });
    } catch (e) {
      console.error('Exception during video loading:', e);
      this.isLoading = false;
      this.loadingSubject.next(false);
    }
  }
  applyFilter(event: Event) {
    // Don't filter if we're already loading
    if (this.isLoading) {
      return;
    }
    
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery = filterValue.trim().toLowerCase();
    
    // Reset to first page when filtering
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    
    // Reload data with the filter
    this.loadVideos();
  }

  filterByType(filter: string) {
    // Don't filter if we're already loading
    if (this.isLoading) {
      return;
    }
    
    this.selectedFilter = filter as 'all' | 'premium' | 'free';
    
    // Reset to first page when changing filter type
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    
    // Reload data with the new filter type
    this.loadVideos();
  }
  togglePremium(video: Video) {
    const newPremiumStatus = !video.isPremium;
    
    this.videoService.updatePremiumStatus(video.id, newPremiumStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            // Update local data if successful
            video.isPremium = newPremiumStatus;
          } else {
            alert('Failed to update premium status. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error updating premium status:', error);
          alert('Failed to update premium status. Please try again.');
        }
      });
  }

  deleteVideo(video: Video) {
    if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
      this.videoService.deleteVideo(video.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (success) => {
            if (success) {
              // Refresh the video list after successful deletion
              this.loadVideos();
            } else {
              alert('Failed to delete video. Please try again.');
            }
          },
          error: (error) => {
            console.error('Error deleting video:', error);
            alert('Failed to delete video. Please try again.');
          }
        });
    }
  }

  editVideo(video: Video) {
    // Navigate to upload component with video ID param for editing
    this.router.navigate(['/admin/upload'], { queryParams: { edit: video.id } });
  }

  bulkDelete() {
    if (this.selection.selected.length === 0) {
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${this.selection.selected.length} videos?`)) {
      const idsToDelete = this.selection.selected.map(video => video.id);
      
      this.videoService.bulkDeleteVideos(idsToDelete)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (success) => {
            if (success) {
              // Refresh the video list after successful deletion
              this.selection.clear();
              this.loadVideos();
            } else {
              alert('Failed to delete videos. Please try again.');
            }
          },
          error: (error) => {
            console.error('Error bulk deleting videos:', error);
            alert('Failed to delete videos. Please try again.');
          }
        });
    }
  }

  bulkTogglePremium(makePremium: boolean) {
    if (this.selection.selected.length === 0) {
      return;
    }
    
    const idsToUpdate = this.selection.selected.map(video => video.id);
    
    this.videoService.bulkUpdatePremiumStatus(idsToUpdate, makePremium)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            // Refresh the video list after successful update
            this.loadVideos();
          } else {
            alert('Failed to update premium status. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error bulk updating premium status:', error);
          alert('Failed to update premium status. Please try again.');
        }
      });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

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

  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  /**
   * Update video duration when metadata is loaded
   */
  updateVideoDuration(video: Video, event: Event): void {
    // Don't process if we're already in loading state
    if (this.isLoading) {
      return;
    }
    
    const videoElement = event.target as HTMLVideoElement;
    if (videoElement && videoElement.duration && !isNaN(videoElement.duration)) {
      const actualDuration = videoElement.duration;
      
      // Only update if there's a significant difference
      if (Math.abs(video.duration - actualDuration) > 1) {
        console.log(`[Admin] Updating video ${video.id} duration from ${video.duration} to ${actualDuration}`);
        
        // Update the local model without triggering refresh
        video.duration = actualDuration;
        
        // Update in the service but do NOT trigger refresh in this component
        // We'll use a flag to indicate this is a background update
        this.videoService.updateVideoDuration(video.id, actualDuration, true);
      }
    }
  }

  /**
   * Force reset loading state and try to load videos again
   */
  forceResetLoading(): void {
    console.log('Force resetting loading state via emergency button');
    
    // Reset all loading state flags
    this.isLoading = false;
    this.loadingSubject.next(false);
    
    // Try to load videos without filters
    this.selectedFilter = 'all';
    this.searchQuery = '';
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    
    // Wait a moment then try to load again
    setTimeout(() => {
      console.log('Attempting to reload videos after emergency reset');
      
      // Try direct video loading if needed
      this.loadAllVideosDirectly();
    }, 1000);
  }

  /**
   * As a last resort, try to load videos directly using the getAllVideos endpoint
   */
  private loadAllVideosDirectly(): void {
    console.log('Attempting to load all videos directly as fallback');
    
    // Make direct call without pagination
    this.videoService.getAllVideos().subscribe({
      next: (videos) => {
        console.log('Direct video loading successful, found:', videos.length);
        // Update UI with these videos
        this.dataSource.data = videos;
        this.totalVideos = videos.length;
      },
      error: (err) => {
        console.error('Even direct video loading failed:', err);
        // Show empty state as fallback
        this.dataSource.data = [];
        this.totalVideos = 0;
      }
    });
  }

  // Helper methods for formatting display data
  // These methods remain client-side since they're just for display
}
