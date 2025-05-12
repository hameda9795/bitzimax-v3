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
          video.width = video.videoWidth;
          video.height = video.videoHeight;

          // Create canvas and context for drawing video frames
          const canvas = document.createElement('canvas');
          canvas.width = video.width;
          canvas.height = video.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            observer.error(new Error('Could not create canvas context'));
            return;
          }

          // Set up MediaRecorder to capture the canvas output
          const stream = canvas.captureStream(30); // 30 fps
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9', // Using VP9 codec for better compression
            videoBitsPerSecond: 2500000 // 2.5 Mbps - can be adjusted
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

          // Play the video to start the conversion process
          video.play().catch(err => {
            observer.error(new Error(`Failed to play video for conversion: ${err}`));
          });

          // Stop recording when the video ends
          video.onended = () => {
            mediaRecorder.stop();
          };
        };

        video.onerror = () => {
          URL.revokeObjectURL(fileURL);
          observer.error(new Error('Error loading video for conversion'));
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
    // WebM with VP9 typically achieves ~50-70% reduction depending on content
    // We'll use a conservative 50% estimate
    return Math.round(originalSize * 0.5);
  }
}
