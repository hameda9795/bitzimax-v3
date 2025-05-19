package com.bitzomax.controller;

import com.bitzomax.dto.VideoDTO;
import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.service.FileStorageService;
import com.bitzomax.service.VideoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class AdminVideoControllerTest {

    private MockMvc mockMvc;

    @Mock
    private VideoService videoService;

    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private AdminVideoController adminVideoController;

    private Video testVideo;
    private VideoDTO testVideoDTO;
    private List<VideoDTO> videoDTOList;
    private List<Video> videoList;

    @BeforeEach
    void setUp() {
        // Set up test video
        testVideo = new Video();
        testVideo.setId(1L);
        testVideo.setTitle("Admin Test Video");
        testVideo.setDescription("Admin Video Description");
        testVideo.setVideoUrl("http://example.com/video.mp4");
        testVideo.setThumbnailUrl("http://example.com/thumbnail.jpg");
        testVideo.setViews(100L);
        testVideo.setLikes(50L);
        testVideo.setIsPremium(true);
        testVideo.setUploadDate(LocalDateTime.now());
        testVideo.setDuration(300);
        testVideo.setConversionStatus(ConversionStatus.COMPLETED);
        testVideo.setIsVisible(true);

        // Set up test video DTO
        testVideoDTO = new VideoDTO();
        testVideoDTO.setId(1L);
        testVideoDTO.setTitle("Admin Test Video");
        testVideoDTO.setDescription("Admin Video Description");
        testVideoDTO.setVideoUrl("http://example.com/video.mp4");
        testVideoDTO.setThumbnailUrl("http://example.com/thumbnail.jpg");
        testVideoDTO.setViews(100L);
        testVideoDTO.setLikes(50L);
        testVideoDTO.setIsPremium(true);
        testVideoDTO.setDuration(300);
        testVideoDTO.setConversionStatus(ConversionStatus.COMPLETED);

        // Set up list of video DTOs
        videoDTOList = new ArrayList<>();
        videoDTOList.add(testVideoDTO);

        // Set up list of videos
        videoList = new ArrayList<>();
        videoList.add(testVideo);

        // Set up MockMvc
        mockMvc = MockMvcBuilders.standaloneSetup(adminVideoController).build();
    }

    @Test
    @DisplayName("Should get all videos with pagination")
    void getAllVideos() throws Exception {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<VideoDTO> videoPage = new PageImpl<>(videoDTOList, pageable, 1);

        when(videoService.getAllVideosWithPagination(any(Pageable.class))).thenReturn(videoPage);        // When/Then
        mockMvc.perform(get("/api/admin/videos")
                .param("page", "0")
                .param("size", "10")
                .param("sort", "uploadDate")
                .param("direction", "desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.videos", hasSize(1)))
                .andExpect(jsonPath("$.videos[0].title", is("Admin Test Video")))
                .andExpect(jsonPath("$.totalItems", is(1)))
                .andExpect(jsonPath("$.currentPage", is(0)));

        verify(videoService).getAllVideosWithPagination(any(Pageable.class));
    }

    @Test
    @DisplayName("Should upload a new video")
    void uploadVideo() throws Exception {
        // Given
        MockMultipartFile videoFile = new MockMultipartFile(
                "videoFile", 
                "test.mp4", 
                "video/mp4", 
                "test video content".getBytes());
        
        MockMultipartFile thumbnailFile = new MockMultipartFile(
                "thumbnailFile", 
                "thumbnail.jpg", 
                "image/jpeg", 
                "test thumbnail content".getBytes());

        // Mock file storage responses
        when(fileStorageService.storeVideoFile(any())).thenReturn(
                new com.bitzomax.dto.FileUploadResponse("test.mp4", "video/mp4", "/uploads/videos/test.mp4", 1000L));
        when(fileStorageService.storeThumbnailFile(any())).thenReturn(
                new com.bitzomax.dto.FileUploadResponse("thumbnail.jpg", "image/jpeg", "/uploads/thumbnails/thumbnail.jpg", 500L));
        
        // Mock video creation
        when(videoService.createVideo(any(VideoDTO.class))).thenReturn(testVideoDTO);        // When/Then
        mockMvc.perform(multipart("/api/admin/videos")
                .file(videoFile)
                .file(thumbnailFile)
                .param("title", "New Test Video")
                .param("description", "New Description")
                .param("isPremium", "true"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Admin Test Video")));

        verify(fileStorageService).storeVideoFile(any());
        verify(fileStorageService).storeThumbnailFile(any());
        verify(videoService).createVideo(any(VideoDTO.class));
    }

    @Test
    @DisplayName("Should update video visibility")
    void updateVideoVisibility() throws Exception {
        // Given        doNothing().when(videoService).updateVideoVisibility(eq(1L), eq(true));

        // When/Then
        mockMvc.perform(put("/api/admin/videos/1/visibility")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"isVisible\": true}"))
                .andExpect(status().isOk());

        verify(videoService).updateVideoVisibility(eq(1L), eq(true));
    }

    @Test
    @DisplayName("Should update video conversion status")
    void updateVideoConversionStatus() throws Exception {
        // Given
        doNothing().when(videoService).updateVideoConversionStatus(eq(1L), eq(ConversionStatus.COMPLETED));        // When/Then
        mockMvc.perform(put("/api/admin/videos/1/conversion-status")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\": \"COMPLETED\"}"))
                .andExpect(status().isOk());

        verify(videoService).updateVideoConversionStatus(eq(1L), eq(ConversionStatus.COMPLETED));
    }
}
