import { TestBed } from '@angular/core/testing';

import { VideoConversionService } from './video-conversion.service';

describe('VideoConversionService', () => {
  let service: VideoConversionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoConversionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
