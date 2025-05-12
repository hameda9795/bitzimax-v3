import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { Router, RouterLink } from '@angular/router';

import { VideoService } from '../../../core/services/video.service';
import { Video } from '../../../shared/models/video.model';

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
export class VideoManagementComponent implements OnInit {
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

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom sort for date objects
    this.dataSource.sortingDataAccessor = (item: Video, property) => {
      switch (property) {
        case 'uploadDate':
          return new Date(item.uploadDate).getTime();
        default:
          return (item as any)[property];
      }
    };
  }

  loadVideos() {
    this.isLoading = true;

    // In a real app, this would call your API with filters
    // For now, we'll generate mock data
    setTimeout(() => {
      this.generateMockVideos();
      this.isLoading = false;
      this.totalVideos = this.dataSource.data.length;
    }, 800);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchQuery = filterValue.trim().toLowerCase();
    this.dataSource.filter = this.searchQuery;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filterByType(filter: string) {
    this.selectedFilter = filter;
    
    this.dataSource.filterPredicate = (data: Video, filter: string) => {
      const searchFilter = this.searchQuery.trim().toLowerCase();
      const searchMatch = data.title.toLowerCase().includes(searchFilter) || 
                         data.description.toLowerCase().includes(searchFilter);
                         
      if (this.selectedFilter === 'all') {
        return searchMatch;
      } else if (this.selectedFilter === 'premium') {
        return data.isPremium && searchMatch;
      } else {
        return !data.isPremium && searchMatch;
      }
    };
    
    this.dataSource.filter = this.searchQuery; // Trigger filtering
  }

  togglePremium(video: Video) {
    video.isPremium = !video.isPremium;
    
    // In a real app, call your API to update the video
    console.log(`Set video ${video.id} premium status to: ${video.isPremium}`);
  }

  deleteVideo(video: Video) {
    if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
      // In a real app, call your API to delete the video
      // For now, we'll just remove it from the local data
      this.dataSource.data = this.dataSource.data.filter(v => v.id !== video.id);
      this.totalVideos = this.dataSource.data.length;
      
      console.log(`Deleted video: ${video.id}`);
    }
  }

  editVideo(video: Video) {
    // In a real app, navigate to the edit page for this video
    console.log(`Editing video: ${video.id}`);
    
    // Navigate to upload component with video ID param for editing
    this.router.navigate(['/admin/upload'], { queryParams: { edit: video.id } });
  }

  bulkDelete() {
    if (this.selection.selected.length === 0) {
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${this.selection.selected.length} videos?`)) {
      // In a real app, call your API to bulk delete
      const idsToDelete = this.selection.selected.map(video => video.id);
      this.dataSource.data = this.dataSource.data.filter(v => !idsToDelete.includes(v.id));
      this.selection.clear();
      this.totalVideos = this.dataSource.data.length;
      
      console.log(`Bulk deleted videos: ${idsToDelete.join(', ')}`);
    }
  }

  bulkTogglePremium(makePremium: boolean) {
    if (this.selection.selected.length === 0) {
      return;
    }
    
    // In a real app, call your API to update the videos
    this.selection.selected.forEach(video => {
      video.isPremium = makePremium;
    });
    
    console.log(`Set ${this.selection.selected.length} videos to premium: ${makePremium}`);
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

  // Generate mock video data for demonstration
  private generateMockVideos() {
    const videoTitles = [
      'Night City Dreams', 'Neon Whispers', 'Digital Prophecy',
      'Chrome Hearts', 'Electric Soul', 'Synthetic Memories',
      'Virtual Eden', 'Cyber Dawn', 'Quantum Echo',
      'Binary Sunset', 'Neural Network', 'Hologram Heart',
      'Digital Rain', 'Ghost in the Machine', 'Silicon Dreams',
      'Neon Streets', 'Tech Noir', 'Cybernetic Symphony',
      'Artificial Soul', 'Data Stream'
    ];
    
    const descriptions = [
      'A journey through the digital landscape of consciousness',
      'Exploring the boundaries between human and machine',
      'When synthetic minds dream of electric reality',
      'The rhythm of artificial hearts in a neon-lit world',
      'Memories encoded in the fabric of cyberspace'
    ];
    
    const mockVideos: Video[] = [];
    
    for (let i = 1; i <= 30; i++) {
      const randomViews = Math.floor(Math.random() * 200000) + 1000;
      const randomLikes = Math.floor(randomViews * (Math.random() * 0.3 + 0.05));
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 60));
      
      mockVideos.push({
        id: `video-${i}`,
        title: videoTitles[Math.floor(Math.random() * videoTitles.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        thumbnailUrl: `https://via.placeholder.com/320x180/1A1A1A/00F3FF?text=CYBER+VIDEO+${i}`,
        videoUrl: '#',
        duration: Math.floor(Math.random() * 300) + 60,
        views: randomViews,
        likes: randomLikes,
        isPremium: Math.random() > 0.7,
        uploadDate: randomDate,
        tags: ['cyberpunk', 'future', 'neon'],
        commentCount: Math.floor(Math.random() * 50),
        shareCount: Math.floor(Math.random() * 30),
        engagementRate: Math.random() * 10 + 5
      });
    }
    
    this.dataSource.data = mockVideos;
  }
}
