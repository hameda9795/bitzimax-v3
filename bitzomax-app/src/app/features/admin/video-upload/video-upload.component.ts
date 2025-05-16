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
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { GenreService } from '../../../core/services/genre.service';
import { Genre } from '../../../shared/models/genre.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';

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
    MatSlideToggleModule,
    MatCardModule,
    MatSnackBarModule,
    MatSelectModule
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
  isEditing = false;
  editingVideoId: string | null = null;
  uploadError: string | null = null;
  genres: Genre[] = [];
  isWebMSupported = true;

  constructor(
    private fb: FormBuilder,
    private videoConversionService: VideoConversionService,
    private videoService: VideoService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private genreService: GenreService
  ) {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      poemText: [''],
      seoTitle: [''],
      seoDescription: [''],
      isPremium: [false],
      genreId: [null]
    });

    // Check if WebM conversion is supported by the browser
    this.isWebMSupported = this.videoConversionService.isWebMConversionSupported();
  }

  ngOnInit(): void {
    // Check if we're editing an existing video
    this.route.queryParams.subscribe(params => {
      const videoId = params['edit'];
      if (videoId) {
        this.isEditing = true;
        this.editingVideoId = videoId;
        this.loadVideoData(videoId);
      }
    });

    // Load genres
    this.genreService.genres$.subscribe(genres => {
      this.genres = genres;
    });
  }

  private loadVideoData(videoId: string): void {
    this.videoService.getVideoById(videoId).subscribe({
      next: (video) => {
        if (video) {
          // Pre-fill the form with existing video data
          this.uploadForm.patchValue({
            title: video.title,
            description: video.description,
            poemText: video.poemText || '',
            isPremium: video.isPremium,
            genreId: video.genre ? video.genre.id : null
          });

          // Set thumbnail preview if exists
          if (video.thumbnailUrl) {
            this.thumbnailPreview = video.thumbnailUrl;
          }
        }
      },
      error: (error) => {
        console.error('Error loading video data:', error);
        this.snackBar.open('Failed to load video data. Please try again.', 'Close', {
          duration: 5000
        });
        this.router.navigate(['/admin/videos']);
      }
    });
  }

  // Handles video file selection
  onVideoSelected(event: any) {
    if (event.target.files && event.target.files.length) {
      this.videoFile = event.target.files[0];
      
      // Reset conversion state when a new file is selected
      this.convertedFile = null;
      this.conversionComplete = false;
      
      if (this.videoFile) {
        this.originalFileSize = this.videoFile.size;
        this.convertedFileSize = this.videoConversionService.getEstimatedWebMSize(this.originalFileSize);
        
        // Show a warning for very large files
        if (this.originalFileSize > 500 * 1024 * 1024) { // 500MB
          this.snackBar.open('Large file detected. Converting to WebM is recommended to reduce file size.', 'OK', {
            duration: 6000
          });
        }

        // Show warning if WebM conversion is not supported
        if (!this.isWebMSupported) {
          this.snackBar.open('WebM conversion is not supported in your browser. Try using Chrome or Firefox for this feature.', 'OK', {
            duration: 8000
          });
        }
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
    this.uploadError = null;
    
    // Simulate progress (in a real app, you'd get actual progress from the conversion)
    const progressInterval = setInterval(() => {
      if (this.conversionProgress < 95) {  // Cap at 95% until actually complete
        this.conversionProgress += 5;
      }
    }, 300);
    
    this.videoConversionService.convertToWebM(this.videoFile)
      .pipe(
        finalize(() => {
          clearInterval(progressInterval);
          this.isConverting = false;
          // Only set to 100% if successful - error handler will stop progress
          if (!this.uploadError) {
            this.conversionProgress = 100;
          }
        })
      )
      .subscribe({
        next: (convertedFile) => {
          this.convertedFile = convertedFile;
          this.convertedFileSize = convertedFile.size;
          this.conversionComplete = true;
          this.snackBar.open('Video successfully converted to WebM!', 'Great!', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Conversion error:', error);
          this.uploadError = error.message || 'An unknown error occurred during conversion';
          this.conversionProgress = 0;
          this.isConverting = false;
          this.snackBar.open(this.uploadError || 'Conversion failed', 'OK', {
            duration: 8000
          });
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
      // Use the converted file if available, otherwise use the original
      const fileToUpload = this.convertedFile || this.videoFile;
      
      // Add form data
      const videoData: Partial<Video> = {
        ...this.uploadForm.value,
        hashtags: this.hashtags,
        seoKeywords: this.seoKeywords,
        originalFormat: this.videoFile?.type,
        genre: this.uploadForm.value.genreId ? { id: this.uploadForm.value.genreId } : null
      };
      
      if (!fileToUpload) {
        console.error('No video file to upload');
        return;
      }
      
      this.isUploading = true;
      this.uploadProgress = 0;
      
      // Call the video service to upload
      const uploadSubscription = this.videoService.uploadVideo(fileToUpload, this.thumbnailFile, videoData)
        .subscribe({
          next: (event: HttpEvent<any>) => {
            if (event.type === HttpEventType.UploadProgress && event.total) {
              this.uploadProgress = Math.round(100 * event.loaded / event.total);
            } else if (event.type === HttpEventType.Response) {
              this.isUploading = false;
              this.resetForm();
              this.snackBar.open('Video uploaded successfully!', 'Great!', {
                duration: 3000
              });
              this.videoService.refreshVideos();
              this.router.navigate(['/admin/videos']);
            }
          },
          error: (error) => {
            this.isUploading = false;
            console.error('Upload error:', error);
            this.snackBar.open(`Upload failed: ${error.message || 'Unknown error'}`, 'OK', {
              duration: 5000
            });
            uploadSubscription.unsubscribe();
          },
          complete: () => {
            uploadSubscription.unsubscribe();
          }
        });
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

  prepareVideoData(): any {
    const formValue = this.uploadForm.value;
    
    // Create video data object
    const videoData = {
      title: formValue.title,
      description: formValue.description,
      poemText: formValue.poemText,
      seoTitle: formValue.seoTitle || formValue.title,
      seoDescription: formValue.seoDescription || formValue.description,
      isPremium: formValue.isPremium,
      hashtags: this.hashtags,
      seoKeywords: this.seoKeywords,
      originalFormat: this.videoFile?.type,
      // Include information about whether the file was converted to WebM
      convertedToWebM: this.convertedFile !== null,
      genre: formValue.genreId ? { id: formValue.genreId } : null
    };
    
    return videoData;
  }
}
