package com.bitzomax.service;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VideoFixServiceTest {

    @Mock
    private VideoRepository videoRepository;

    @InjectMocks
    private VideoFixService videoFixService;

    @Captor
    private ArgumentCaptor<Video> videoCaptor;

    private List<Video> testVideos;

    @BeforeEach
    void setUp() {
        // Set up test videos with various visibility and conversion statuses
        testVideos = new ArrayList<>();

        // Video 1: Completed but not visible
        Video video1 = new Video();
        video1.setId(1L);
        video1.setTitle("Video 1");
        video1.setConversionStatus(ConversionStatus.COMPLETED);
        video1.setIsVisible(false);
        testVideos.add(video1);

        // Video 2: Completed and already visible
        Video video2 = new Video();
        video2.setId(2L);
        video2.setTitle("Video 2");
        video2.setConversionStatus(ConversionStatus.COMPLETED);
        video2.setIsVisible(true);
        testVideos.add(video2);

        // Video 3: Not completed and not visible
        Video video3 = new Video();
        video3.setId(3L);
        video3.setTitle("Video 3");
        video3.setConversionStatus(ConversionStatus.PROCESSING);
        video3.setIsVisible(false);
        testVideos.add(video3);

        // Video 4: Completed but null visibility
        Video video4 = new Video();
        video4.setId(4L);
        video4.setTitle("Video 4");
        video4.setConversionStatus(ConversionStatus.COMPLETED);
        video4.setIsVisible(null);
        testVideos.add(video4);
    }

    @Test
    @DisplayName("Should fix visibility for completed videos that aren't visible")
    void fixVideoVisibility() {
        // Given
        when(videoRepository.findAll()).thenReturn(testVideos);

        // When
        int fixedCount = videoFixService.fixVideoVisibility();

        // Then
        // We expect 2 videos to be fixed: video1 (completed but not visible) and video4 (completed with null visibility)
        assertEquals(2, fixedCount);
        
        // Verify that save was called twice
        verify(videoRepository, times(2)).save(videoCaptor.capture());
        
        List<Video> capturedVideos = videoCaptor.getAllValues();
        assertEquals(2, capturedVideos.size());
        
        // Verify that both videos are now visible
        for (Video video : capturedVideos) {
            assertEquals(true, video.getIsVisible());
        }
    }

    @Test
    @DisplayName("Should make all videos visible regardless of status")
    void forceAllVideosVisible() {
        // Given
        when(videoRepository.findAll()).thenReturn(testVideos);

        // When
        int fixedCount = videoFixService.forceAllVideosVisible();

        // Then
        // We expect 3 videos to be fixed: video1, video3, and video4
        assertEquals(3, fixedCount);
        
        // Verify that save was called three times
        verify(videoRepository, times(3)).save(videoCaptor.capture());
        
        List<Video> capturedVideos = videoCaptor.getAllValues();
        assertEquals(3, capturedVideos.size());
        
        // Verify that all modified videos are now visible
        for (Video video : capturedVideos) {
            assertEquals(true, video.getIsVisible());
        }
    }
}
