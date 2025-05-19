import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VideoService } from './video.service';
import { Video } from '../../shared/models/video.model';
import { UrlService } from './url.service';

describe('VideoService', () => {
  let service: VideoService;
  let httpMock: HttpTestingController;
  let urlService: jasmine.SpyObj<UrlService>;

  const mockVideos = [
    {
      id: 1,
      title: 'Test Video 1',
      description: 'Test Description 1',
      thumbnailUrl: '/uploads/thumbnails/test1.jpg',
      videoUrl: '/uploads/videos/test1.mp4',
      views: 100,
      likes: 50,
      duration: 120,
      isPremium: false,
      uploadDate: '2025-05-01T10:00:00',
      isVisible: true,
      conversionStatus: 'completed'
    },
    {
      id: 2,
      title: 'Premium Video',
      description: 'Premium Content',
      thumbnailUrl: '/uploads/thumbnails/premium.jpg',
      videoUrl: '/uploads/videos/premium.mp4',
      views: 200,
      likes: 100,
      duration: 240,
      isPremium: true,
      uploadDate: '2025-05-02T10:00:00',
      isVisible: true,
      conversionStatus: 'completed'
    }
  ];

  const baseApiUrl = 'http://localhost:8080';

  beforeEach(() => {
    // Create UrlService spy
    urlService = jasmine.createSpyObj('UrlService', ['getFullUrl']);
    urlService.getFullUrl.and.callFake((url: string) => {
      return `${baseApiUrl}${url}`;
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        VideoService,
        { provide: UrlService, useValue: urlService }
      ]
    });
    
    service = TestBed.inject(VideoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all videos', () => {
    // Subscribe to the videos$ BehaviorSubject
    service.videos$.subscribe(videos => {
      expect(videos).toEqual(mockVideos as Video[]);
    });

    // Trigger the fetchAllVideos method
    service.fetchAllVideos();

    // Expect a GET request to the videos endpoint
    const req = httpMock.expectOne(`${baseApiUrl}/api/videos`);
    expect(req.request.method).toBe('GET');

    // Respond with mock data
    req.flush(mockVideos);
  });

  it('should get video by ID', () => {
    const testVideo = mockVideos[0];
    const videoId = 1;

    service.getVideoById(videoId).subscribe(video => {
      expect(video).toEqual(testVideo as Video);
    });

    const req = httpMock.expectOne(`${baseApiUrl}/api/videos/${videoId}`);
    expect(req.request.method).toBe('GET');
    req.flush(testVideo);
  });

  it('should like a video', () => {
    const videoId = 1;
    const mockResponse = { success: true };

    service.likeVideo(videoId).subscribe(response => {
      expect(response.success).toBeTrue();
    });

    const req = httpMock.expectOne(`${baseApiUrl}/api/videos/${videoId}/like`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should unlike a video', () => {
    const videoId = 1;
    const mockResponse = { success: true };

    service.unlikeVideo(videoId).subscribe(response => {
      expect(response.success).toBeTrue();
    });

    const req = httpMock.expectOne(`${baseApiUrl}/api/videos/${videoId}/unlike`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should add a video to favorites', () => {
    const videoId = 1;
    const mockResponse = true;

    service.addToFavorites(videoId).subscribe(response => {
      expect(response).toBeTrue();
    });

    const req = httpMock.expectOne(`${baseApiUrl}/api/users/favorites/${videoId}`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle errors when fetching videos', () => {
    service.fetchAllVideos();

    const req = httpMock.expectOne(`${baseApiUrl}/api/videos`);
    expect(req.request.method).toBe('GET');

    // Create a mock error response
    req.error(new ErrorEvent('Network error'));

    // The service should handle the error and the videos$ BehaviorSubject should remain unchanged
    service.videos$.subscribe(videos => {
      expect(videos).toEqual([]);
    });
  });
});
