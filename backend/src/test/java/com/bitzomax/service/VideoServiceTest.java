package com.bitzomax.service;

import com.bitzomax.dto.VideoDTO;
import com.bitzomax.mapper.VideoMapper;
import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Genre;
import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VideoServiceTest {

    @Mock
    private VideoRepository videoRepository;

    @Mock
    private VideoMapper videoMapper;

    @InjectMocks
    private VideoService videoService;

    private Video testVideo;
    private VideoDTO testVideoDTO;
    private List<Video> videoList;

    @BeforeEach
    void setUp() {
        // Set up test data
        testVideo = new Video();
        testVideo.setId(1L);
        testVideo.setTitle("Test Video");
        testVideo.setDescription("Test Description");
        testVideo.setVideoUrl("http://example.com/video.mp4");
        testVideo.setThumbnailUrl("http://example.com/thumbnail.jpg");
        testVideo.setViews(100L);
        testVideo.setLikes(50L);
        testVideo.setIsPremium(false);
        testVideo.setUploadDate(LocalDateTime.now());
        testVideo.setDuration(300); // 5 minutes
        testVideo.setConversionStatus(ConversionStatus.COMPLETED);
        testVideo.setIsVisible(true);

        Genre genre = new Genre();
        genre.setId(1L);
        genre.setName("Music");
        testVideo.setGenre(genre);

        testVideoDTO = new VideoDTO();
        testVideoDTO.setId(1L);
        testVideoDTO.setTitle("Test Video");
        testVideoDTO.setDescription("Test Description");

        videoList = Arrays.asList(testVideo);
    }

    @Test
    @DisplayName("Should return all videos")
    void getAllVideos() {
        // Given
        when(videoRepository.findAll()).thenReturn(videoList);

        // When
        List<Video> result = videoService.getAllVideos(true);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Video", result.get(0).getTitle());
        verify(videoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should filter hidden videos when requested")
    void getAllVideosFiltered() {
        // Given
        when(videoRepository.findByIsVisibleTrue()).thenReturn(videoList);

        // When
        List<Video> result = videoService.getAllVideos(false);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(videoRepository, times(1)).findByIsVisibleTrue();
    }

    @Test
    @DisplayName("Should return paged videos")
    void getPagedVideos() {
        // Given
        Page<Video> page = new PageImpl<>(videoList);
        Pageable pageable = mock(Pageable.class);
        when(videoRepository.findAll(pageable)).thenReturn(page);

        // When
        Page<Video> result = videoService.getPagedVideos(pageable, true);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(videoRepository, times(1)).findAll(pageable);
    }

    @Test
    @DisplayName("Should find video by ID")
    void findVideoById() {
        // Given
        when(videoRepository.findById(1L)).thenReturn(Optional.of(testVideo));

        // When
        Optional<Video> result = videoService.findVideoById(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals("Test Video", result.get().getTitle());
        verify(videoRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should save video")
    void saveVideo() {
        // Given
        when(videoRepository.save(any(Video.class))).thenReturn(testVideo);

        // When
        Video result = videoService.saveVideo(testVideo);

        // Then
        assertNotNull(result);
        assertEquals("Test Video", result.getTitle());
        verify(videoRepository, times(1)).save(testVideo);
    }

    @Test
    @DisplayName("Should update video visibility")
    void updateVideoVisibility() {
        // Given
        when(videoRepository.findById(1L)).thenReturn(Optional.of(testVideo));
        when(videoRepository.save(any(Video.class))).thenReturn(testVideo);

        // When
        videoService.updateVideoVisibility(1L, false);

        // Then
        verify(videoRepository, times(1)).findById(1L);
        verify(videoRepository, times(1)).save(any(Video.class));
    }

    @Test
    @DisplayName("Should update video conversion status")
    void updateVideoConversionStatus() {
        // Given
        when(videoRepository.findById(1L)).thenReturn(Optional.of(testVideo));
        when(videoRepository.save(any(Video.class))).thenReturn(testVideo);

        // When
        videoService.updateVideoConversionStatus(1L, ConversionStatus.FAILED);

        // Then
        verify(videoRepository, times(1)).findById(1L);
        verify(videoRepository, times(1)).save(any(Video.class));
    }

    @Test
    @DisplayName("Should create video from DTO")
    void createVideo() {
        // Given
        when(videoMapper.toEntity(any(VideoDTO.class))).thenReturn(testVideo);
        when(videoRepository.save(any(Video.class))).thenReturn(testVideo);
        when(videoMapper.toDto(any(Video.class))).thenReturn(testVideoDTO);

        // When
        VideoDTO result = videoService.createVideo(testVideoDTO);

        // Then
        assertNotNull(result);
        verify(videoMapper, times(1)).toEntity(any(VideoDTO.class));
        verify(videoRepository, times(1)).save(any(Video.class));
        verify(videoMapper, times(1)).toDto(any(Video.class));
    }

    @Test
    @DisplayName("Should get video by ID as DTO")
    void getVideoById() {
        // Given
        when(videoRepository.findById(1L)).thenReturn(Optional.of(testVideo));
        when(videoMapper.toDto(any(Video.class))).thenReturn(testVideoDTO);

        // When
        VideoDTO result = videoService.getVideoById(1L);

        // Then
        assertNotNull(result);
        assertEquals("Test Video", result.getTitle());
        verify(videoRepository, times(1)).findById(1L);
        verify(videoMapper, times(1)).toDto(any(Video.class));
    }

    @Test
    @DisplayName("Should throw exception when getting non-existent video by ID")
    void getVideoByIdNotFound() {
        // Given
        when(videoRepository.findById(999L)).thenReturn(Optional.empty());

        // Then
        assertThrows(jakarta.persistence.EntityNotFoundException.class, () -> {
            // When
            videoService.getVideoById(999L);
        });
        verify(videoRepository, times(1)).findById(999L);
    }

    @Test
    @DisplayName("Should delete video")
    void deleteVideo() {
        // When
        videoService.deleteVideo(1L);

        // Then
        verify(videoRepository, times(1)).deleteById(1L);
    }
}
