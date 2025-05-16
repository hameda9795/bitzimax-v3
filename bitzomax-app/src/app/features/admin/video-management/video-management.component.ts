import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';

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
export class VideoManagementComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'select', 'thumbnail', 'title', 'uploadDate', 'views', 
    'likes', 'premium', 'actions'
  ];
  dataSource = new MatTableDataSource<Video>([]);
  selection = new SelectionModel<Video>(true, []);
  isLoading = true;
  totalVideos = 0;
  selectedFilter = 'all';
  searchQuery = '';
  
  // Pagination parameters
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Used for server-side pagination
  currentPageResponse: PageResponse<Video> | null = null;
  
  // Subject for handling unsubscribe on destroy
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private videoService: VideoService,
    private dialog: MatDialog,
    private router: Router
  ) { }
  ngOnInit(): void {
    this.loadVideos();
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions when the component is destroyed
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    // Subscribe to paginator page changes
    this.paginator.page
      .pipe(takeUntil(this.destroy$))
      .subscribe((pageEvent: PageEvent) => {
        this.pageIndex = pageEvent.pageIndex;
        this.pageSize = pageEvent.pageSize;
        this.loadVideos();
      });
      
    // Subscribe to sort changes
    this.sort.sortChange
      .pipe(takeUntil(this.destroy$))
      .subscribe((sort: Sort) => {
        // Reset to first page when sorting changes
        this.pageIndex = 0;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.loadVideos(sort.active, sort.direction);
      });
  }

  loadVideos(sortField?: string, sortDirection?: 'asc' | 'desc' | '') {
    this.isLoading = true;
    
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
    
    // Call API with the page request
    this.videoService.getVideos(pageRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page: PageResponse<Video>) => {
          this.currentPageResponse = page;
          this.dataSource.data = page.content;
          this.totalVideos = page.totalElements;
          this.isLoading = false;
          
          // Reset selection when loading new data
          this.selection.clear();
        },
        error: (error) => {
          console.error('Error loading videos:', error);
          this.isLoading = false;
          this.dataSource.data = [];
          this.totalVideos = 0;
          alert('Failed to load videos. Please try again.');
        }
      });
  }
  applyFilter(event: Event) {
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
    this.selectedFilter = filter;
    
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
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
  // Helper methods for formatting display data
  // These methods remain client-side since they're just for display
}
