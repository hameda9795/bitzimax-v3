import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { VideoConversionService } from '../services/video-conversion.service';
import { VideoService } from '../../../core/services/video.service';
import { Video } from '../../../shared/models/video.model';
import { Observable, finalize, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-video-upload',
  templateUrl: './video-upload.component.html',
  styleUrls: ['./video-upload.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressBarModule,
    MatSlideToggleModule
  ]
})
export class VideoUploadComponent implements OnInit {
  uploadForm: FormGroup;
  videoFile: File | null = null;
  convertedFile: File | null = null;
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  hashtags: string[] = [];
  seoKeywords: string[] = [];
  isConverting = false;
  conversionProgress = 0;
  isUploading = false;
  uploadProgress = 0;
  conversionComplete = false;
  originalFileSize = 0;
  convertedFileSize = 0;
  
  constructor(
    private fb: FormBuilder,
    private videoConversionService: VideoConversionService,
    private videoService: VideoService
  ) {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      poemText: [''],
      seoTitle: [''],
      seoDescription: [''],
      isPremium: [false]
    });
  }

  ngOnInit(): void {
  }

  // Handles video file selection
  onVideoSelected(event: any) {
    if (event.target.files && event.target.files.length) {
      this.videoFile = event.target.files[0];
      if (this.videoFile) {
        this.originalFileSize = this.videoFile.size;
        this.convertedFileSize = this.videoConversionService.getEstimatedWebMSize(this.originalFileSize);
      }
    }
  }

  // Handles thumbnail file selection
  onThumbnailSelected(event: any) {
    if (event.target.files && event.target.files.length) {
      this.thumbnailFile = event.target.files[0];
      
      if (this.thumbnailFile) {
        // Create a preview of the thumbnail
        const reader = new FileReader();
        reader.onload = () => {
          this.thumbnailPreview = reader.result as string;
        };
        reader.readAsDataURL(this.thumbnailFile);
      }
    }
  }

  // Convert video to WebM format
  convertVideoToWebM() {
    if (!this.videoFile) return;
    
    this.isConverting = true;
    this.conversionProgress = 0;
    
    // Simulate progress (in a real app, you'd get actual progress from the conversion)
    const progressInterval = setInterval(() => {
      this.conversionProgress += 10;
      if (this.conversionProgress >= 100) {
        clearInterval(progressInterval);
      }
    }, 300);
    
    this.videoConversionService.convertToWebM(this.videoFile)
      .pipe(
        finalize(() => {
          this.isConverting = false;
          this.conversionProgress = 100;
          this.conversionComplete = true;
          clearInterval(progressInterval);
        })
      )
      .subscribe({
        next: (convertedFile) => {
          this.convertedFile = convertedFile;
          this.convertedFileSize = convertedFile.size;
        },
        error: (error) => {
          console.error('Conversion error:', error);
          // Handle error state
        }
      });
  }

  // Add a hashtag
  addHashtag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.hashtags.push(value);
    }
    event.chipInput!.clear();
  }

  // Remove a hashtag
  removeHashtag(hashtag: string): void {
    const index = this.hashtags.indexOf(hashtag);
    if (index >= 0) {
      this.hashtags.splice(index, 1);
    }
  }

  // Add a SEO keyword
  addSeoKeyword(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.seoKeywords.push(value);
    }
    event.chipInput!.clear();
  }

  // Remove a SEO keyword
  removeSeoKeyword(keyword: string): void {
    const index = this.seoKeywords.indexOf(keyword);
    if (index >= 0) {
      this.seoKeywords.splice(index, 1);
    }
  }

  // Calculate size reduction percentage
  getSizeReductionPercentage(): number {
    if (!this.originalFileSize || !this.convertedFileSize) return 0;
    return Math.round(((this.originalFileSize - this.convertedFileSize) / this.originalFileSize) * 100);
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Submit the form to upload the video
  onSubmit() {
    if (this.uploadForm.valid && (this.videoFile || this.convertedFile) && this.thumbnailFile) {
      const formData = new FormData();
      
      // Use the converted file if available, otherwise use the original
      const fileToUpload = this.convertedFile || this.videoFile;
      if (fileToUpload) {
        formData.append('videoFile', fileToUpload);
      }
      
      formData.append('thumbnailFile', this.thumbnailFile);
      
      // Add form data
      const videoData: Partial<Video> = {
        ...this.uploadForm.value,
        hashtags: this.hashtags,
        seoKeywords: this.seoKeywords,
        originalFormat: this.videoFile?.type,
      };
      
      formData.append('videoData', JSON.stringify(videoData));
      
      this.isUploading = true;
      this.uploadProgress = 0;
      
      // Simulate upload progress (in a real app, this would come from an HTTP request)
      const progressInterval = setInterval(() => {
        this.uploadProgress += 5;
        if (this.uploadProgress >= 100) {
          clearInterval(progressInterval);
        }
      }, 200);
      
      // Here you would actually call your API to upload the video
      // For this example, we'll simulate a successful upload
      setTimeout(() => {
        this.isUploading = false;
        this.uploadProgress = 100;
        clearInterval(progressInterval);
        
        // Reset the form
        this.resetForm();
        
        // Show success message
        alert('Video uploaded successfully!');
      }, 4000);
    }
  }
  
  // Reset the form and state
  resetForm() {
    this.uploadForm.reset();
    this.videoFile = null;
    this.convertedFile = null;
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
    this.hashtags = [];
    this.seoKeywords = [];
    this.isConverting = false;
    this.conversionProgress = 0;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.conversionComplete = false;
    this.originalFileSize = 0;
    this.convertedFileSize = 0;
  }
}
