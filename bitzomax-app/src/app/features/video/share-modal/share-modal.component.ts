import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Video } from '../../../shared/models/video.model';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, FormsModule],
  template: `
    <div class="share-modal" [class.show]="isVisible">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Share Video</h2>
          <button type="button" class="close-button" (click)="close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        
        <div class="modal-body">
          <div *ngIf="video" class="video-info">
            <img [src]="video.thumbnailUrl" [alt]="video.title" class="thumbnail">
            <h3>{{video.title}}</h3>
          </div>
          
          <div class="share-options">
            <h4>Share on social media</h4>
            <div class="social-buttons">
              <button class="facebook" matTooltip="Share on Facebook" (click)="shareOnFacebook()">
                <i class="fab fa-facebook-f"></i>
              </button>
              <button class="twitter" matTooltip="Share on Twitter" (click)="shareOnTwitter()">
                <i class="fab fa-twitter"></i>
              </button>
              <button class="linkedin" matTooltip="Share on LinkedIn" (click)="shareOnLinkedIn()">
                <i class="fab fa-linkedin-in"></i>
              </button>
              <button class="whatsapp" matTooltip="Share on WhatsApp" (click)="shareOnWhatsApp()">
                <i class="fab fa-whatsapp"></i>
              </button>
            </div>
          </div>
          
          <div class="share-link">
            <h4>Copy link</h4>
            <div class="link-input">
              <input type="text" [value]="shareUrl" readonly #linkInput>
              <button mat-button (click)="copyLink(linkInput)" matTooltip="Copy to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
            <p *ngIf="copied" class="copied-message">Link copied to clipboard!</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .share-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }
    
    .share-modal.show {
      opacity: 1;
      visibility: visible;
    }
    
    .modal-content {
      width: 90%;
      max-width: 500px;
      background: #121212;
      border: 2px solid #ff3a92;
      border-radius: 8px;
      box-shadow: 0 0 20px rgba(255, 58, 146, 0.5);
      overflow: hidden;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(255, 58, 146, 0.1);
      border-bottom: 1px solid #ff3a92;
    }
    
    .modal-header h2 {
      color: #ff3a92;
      margin: 0;
      font-size: 1.5rem;
    }
    
    .close-button {
      background: transparent;
      border: none;
      color: #ff3a92;
      cursor: pointer;
      padding: 0.5rem;
    }
    
    .modal-body {
      padding: 1.5rem;
    }
    
    .video-info {
      display: flex;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }
    
    .thumbnail {
      width: 100px;
      height: 56px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .video-info h3 {
      color: #fff;
      margin: 0;
      font-size: 1rem;
      flex: 1;
    }
    
    .share-options, .share-link {
      margin-bottom: 1.5rem;
    }
    
    h4 {
      color: #00f3ff;
      margin-bottom: 0.75rem;
      font-size: 1rem;
    }
    
    .social-buttons {
      display: flex;
      gap: 1rem;
    }
    
    .social-buttons button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .social-buttons button:hover {
      transform: scale(1.1);
    }
    
    .facebook { background-color: #1877f2; }
    .twitter { background-color: #1da1f2; }
    .linkedin { background-color: #0a66c2; }
    .whatsapp { background-color: #25d366; }
    
    .link-input {
      display: flex;
      margin-bottom: 0.5rem;
    }
    
    .link-input input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #00f3ff;
      background: rgba(0, 243, 255, 0.1);
      color: white;
      border-radius: 4px 0 0 4px;
    }
    
    .link-input button {
      background: #00f3ff;
      color: black;
      border: none;
      border-radius: 0 4px 4px 0;
      cursor: pointer;
    }
    
    .copied-message {
      color: #00f3ff;
      margin: 0.5rem 0 0;
      font-size: 0.9rem;
    }
  `]
})
export class ShareModalComponent implements OnInit {
  @Input() video: Video | null = null;
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();
  
  shareUrl = '';
  copied = false;
  
  constructor() {}
  
  ngOnInit() {
    // Create share URL based on current location
    if (typeof window !== 'undefined') {
      this.shareUrl = window.location.href;
    }
  }
  
  close() {
    this.isVisible = false;
    this.closed.emit();
  }
  
  shareOnFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareUrl)}`;
    this.openShareWindow(url);
  }
  
  shareOnTwitter() {
    const text = this.video ? `Check out this video: ${this.video.title}` : 'Check out this video';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.shareUrl)}`;
    this.openShareWindow(url);
  }
  
  shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(this.shareUrl)}`;
    this.openShareWindow(url);
  }
  
  shareOnWhatsApp() {
    const text = this.video ? `Check out this video: ${this.video.title} ${this.shareUrl}` : `Check out this video: ${this.shareUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    this.openShareWindow(url);
  }
  
  openShareWindow(url: string) {
    window.open(url, '_blank', 'width=600,height=400');
  }
  
  copyLink(inputElement: HTMLInputElement) {
    inputElement.select();
    document.execCommand('copy');
    
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 3000);
  }
}
