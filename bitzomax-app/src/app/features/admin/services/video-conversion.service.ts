import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VideoConversionService {

  constructor() { }
  
  /**
   * Converts a video file to WebM format for reduced file size
   * Uses the browser's built-in MediaRecorder API for conversion
   * 
   * @param file The original video file to convert
   * @returns Observable with the converted WebM file
   */
  convertToWebM(file: File): Observable<File> {
    // Check if the file is already in WebM format
    if (file.type === 'video/webm') {
      return of(file).pipe(delay(500)); // Return immediately if already WebM
    }

    return new Observable<File>(observer => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.playsInline = true;
        video.muted = true;

        // Create object URL from the file
        const fileURL = URL.createObjectURL(file);
        video.src = fileURL;

        // When metadata is loaded, we can start the conversion
        video.onloadedmetadata = () => {
          // Handle conversion errors for files with no video dimension info
          if (!video.videoWidth || !video.videoHeight) {
            observer.error(new Error('Unable to read video dimensions. The file might be corrupted or in an unsupported format.'));
            URL.revokeObjectURL(fileURL);
            return;
          }

          video.width = video.videoWidth;
          video.height = video.videoHeight;

          // Create canvas and context for drawing video frames
          const canvas = document.createElement('canvas');
          canvas.width = video.width;
          canvas.height = video.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            observer.error(new Error('Could not create canvas context'));
            URL.revokeObjectURL(fileURL);
            return;
          }

          // Check if MediaRecorder supports WebM
          if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp9') && 
              !MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
            observer.error(new Error('Your browser does not support WebM conversion. Try using Chrome or Firefox.'));
            URL.revokeObjectURL(fileURL);
            return;
          }

          // Choose the best available WebM codec
          const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
            ? 'video/webm;codecs=vp9' 
            : 'video/webm;codecs=vp8';

          // Calculate an appropriate bitrate based on resolution
          // Higher resolution videos need higher bitrates to maintain quality
          let videoBitsPerSecond = 1000000; // Default 1 Mbps
          const pixelCount = video.width * video.height;
          
          if (pixelCount > 2073600) { // 1080p and above (1920×1080)
            videoBitsPerSecond = 3500000; // 3.5 Mbps
          } else if (pixelCount > 921600) { // 720p (1280×720)
            videoBitsPerSecond = 2500000; // 2.5 Mbps
          } else if (pixelCount > 409920) { // 480p (854×480)
            videoBitsPerSecond = 1500000; // 1.5 Mbps
          }

          // Set up MediaRecorder to capture the canvas output
          const stream = canvas.captureStream(30); // 30 fps
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: videoBitsPerSecond
          });

          const chunks: BlobPart[] = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            URL.revokeObjectURL(fileURL); // Clean up
            
            // Create a new blob from all chunks
            const blob = new Blob(chunks, { type: 'video/webm' });
            
            // Convert blob to File object
            const convertedFile = new File([blob], 
              file.name.replace(/\.[^/.]+$/, '') + '.webm', 
              { type: 'video/webm' }
            );
            
            observer.next(convertedFile);
            observer.complete();
          };

          // Start recording and playing the video
          mediaRecorder.start(100); // Collect 100ms chunks
          
          video.onplay = () => {
            // Function to draw video frame to canvas
            const drawVideo = () => {
              if (video.paused || video.ended) return;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              requestAnimationFrame(drawVideo);
            };
            
            drawVideo();
          };

          // Handle play errors
          video.onerror = () => {
            URL.revokeObjectURL(fileURL);
            observer.error(new Error(`Error playing video for conversion: ${video.error?.message || 'Unknown error'}`));
            mediaRecorder.stop();
          };

          // Add a timeout in case the video is too long or processing hangs
          const maxConversionTime = 10 * 60 * 1000; // 10 minutes max
          const timeoutId = setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
              observer.error(new Error('Conversion timeout. The video may be too long for browser-based conversion.'));
            }
          }, maxConversionTime);

          // Play the video to start the conversion process
          video.play().catch(err => {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(fileURL);
            observer.error(new Error(`Failed to play video for conversion: ${err}`));
          });

          // Stop recording when the video ends
          video.onended = () => {
            clearTimeout(timeoutId);
            mediaRecorder.stop();
          };
        };

        video.onerror = () => {
          URL.revokeObjectURL(fileURL);
          observer.error(new Error(`Error loading video for conversion: ${video.error?.message || 'Unknown error'}`));
        };
      } catch (err) {
        observer.error(err);
      }
    });
  }

  /**
   * Gets estimated file size reduction for WebM conversion
   * This is an approximation based on typical compression ratios
   * 
   * @param originalSize Size in bytes of the original file
   * @returns Estimated size in bytes after conversion
   */
  getEstimatedWebMSize(originalSize: number): number {
    // Improved estimation based on typical compression ratios
    // Different compression ratios based on file size tiers
    if (originalSize > 500 * 1024 * 1024) { // > 500MB
      return Math.round(originalSize * 0.4); // 60% reduction for large files
    } else if (originalSize > 100 * 1024 * 1024) { // > 100MB
      return Math.round(originalSize * 0.45); // 55% reduction for medium-large files
    } else if (originalSize > 20 * 1024 * 1024) { // > 20MB
      return Math.round(originalSize * 0.5); // 50% reduction for medium files
    } else {
      return Math.round(originalSize * 0.6); // 40% reduction for small files
    }
  }

  /**
   * Checks if the browser supports WebM conversion
   * @returns boolean indicating if conversion is supported
   */
  isWebMConversionSupported(): boolean {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      return false;
    }
    
    // Check if MediaRecorder supports WebM
    return MediaRecorder.isTypeSupported('video/webm;codecs=vp9') || 
           MediaRecorder.isTypeSupported('video/webm;codecs=vp8');
  }
}
