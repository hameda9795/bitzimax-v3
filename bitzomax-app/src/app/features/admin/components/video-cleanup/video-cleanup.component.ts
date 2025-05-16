import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoService } from '../../../../core/services/video.service';
import { Video } from '../../../../shared/models/video.model';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-video-cleanup',
  templateUrl: './video-cleanup.component.html',
  styleUrls: ['./video-cleanup.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VideoCleanupComponent implements OnInit {
  videos: Video[] = [];
  selectedVideos: string[] = [];
  loading = false;
  message = '';
  messageType = 'info';
  
  constructor(
    private videoService: VideoService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadVideos();
  }

  loadVideos(): void {
    this.loading = true;
    this.videoService.getAllVideos().subscribe({
      next: (videos) => {
        this.videos = videos.filter(video => 
          (video.title && (
            video.title.toLowerCase().includes('sample') || 
            video.title.toLowerCase().includes('test') || 
            video.title.toLowerCase().includes('demo'))
          ) || 
          (video.description && (
            video.description.toLowerCase().includes('sample') || 
            video.description.toLowerCase().includes('test') || 
            video.description.toLowerCase().includes('demo'))
          )
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading videos:', error);
        this.loading = false;
        this.message = 'Failed to load videos. Please try again.';
        this.messageType = 'error';
      }
    });
  }

  toggleSelection(videoId: string): void {
    const index = this.selectedVideos.indexOf(videoId);
    if (index > -1) {
      this.selectedVideos.splice(index, 1);
    } else {
      this.selectedVideos.push(videoId);
    }
  }

  selectAllVideos(): void {
    if (this.selectedVideos.length === this.videos.length) {
      // If all are selected, deselect all
      this.selectedVideos = [];
    } else {
      // Otherwise select all
      this.selectedVideos = this.videos.map(video => video.id);
    }
  }

  async deleteSelectedVideos(): Promise<void> {
    if (this.selectedVideos.length === 0) {
      this.message = 'Please select at least one video to delete.';
      this.messageType = 'warning';
      return;
    }

    if (!confirm(`Are you sure you want to delete ${this.selectedVideos.length} videos? This action cannot be undone.`)) {
      return;
    }

    this.loading = true;
    this.message = 'Deleting videos...';
    this.messageType = 'info';

    try {
      // Delete videos one by one using promises
      const deletePromises = this.selectedVideos.map(videoId => 
        firstValueFrom(this.videoService.deleteVideo(videoId))
      );
      
      await Promise.all(deletePromises);
      
      this.message = `Successfully deleted ${this.selectedVideos.length} videos.`;
      this.messageType = 'success';
      this.selectedVideos = [];
      this.loadVideos(); // Refresh the list
    } catch (error) {
      console.error('Error deleting videos:', error);
      this.message = 'Failed to delete some videos. Please try again.';
      this.messageType = 'error';
    } finally {
      this.loading = false;
    }
  }
} 