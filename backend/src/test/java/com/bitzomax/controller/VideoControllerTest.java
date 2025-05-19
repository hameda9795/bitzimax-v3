package com.bitzomax.controller;

import com.bitzomax.dto.FileUploadResponse;
import com.bitzomax.dto.VideoDTO;
import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.service.FileStorageService;
import com.bitzomax.service.VideoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class VideoControllerTest {

    private MockMvc mockMvc;

    @Mock
    private VideoService videoService;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private VideoController videoController;

    private Video testVideo;
    private VideoDTO testVideoDTO;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(videoController)
                .build();

        testVideo = new Video();
        testVideo.setId(1L);
        testVideo.setTitle("Test Video");
        testVideo.setDescription("Test Description");
        testVideo.setVideoUrl("/uploads/videos/test-video.mp4");
        testVideo.setThumbnailUrl("/uploads/thumbnails/test-thumbnail.jpg");
        testVideo.setViews(100L);
        testVideo.setLikes(50L);
        testVideo.setDuration(300);
        testVideo.setUploadDate(LocalDateTime.now());
        testVideo.setIsVisible(true);
        testVideo.setConversionStatus(ConversionStatus.COMPLETED);

        testVideoDTO = new VideoDTO();
        testVideoDTO.setId(1L);
        testVideoDTO.setTitle("Test Video");
        testVideoDTO.setDescription("Test Description");
        testVideoDTO.setVideoUrl("/uploads/videos/test-video.mp4");
        testVideoDTO.setThumbnailUrl("/uploads/thumbnails/test-thumbnail.jpg");
        testVideoDTO.setViews(100L);
        testVideoDTO.setLikes(50L);
        testVideoDTO.setDuration(300);
        testVideoDTO.setUploadDate(LocalDateTime.now());
        testVideoDTO.setIsVisible(true);
        testVideoDTO.setConversionStatus(ConversionStatus.COMPLETED);
    }

    @Test
    @DisplayName("Should get all videos")
    void getAllVideos() throws Exception {
        // Given
        Page<Video> videoPage = new PageImpl<>(Arrays.asList(testVideo));
        when(videoService.getPagedVideos(any(Pageable.class), eq(false))).thenReturn(videoPage);

        // When/Then
        mockMvc.perform(get("/api/videos")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.totalElements", is(1)));
    }

    @Test
    @DisplayName("Should get video by ID")
    void getVideoById() throws Exception {
        // Given
        when(videoService.findVideoById(1L)).thenReturn(Optional.of(testVideo));

        // When/Then
        mockMvc.perform(get("/api/videos/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is("Test Video")));
    }

    @Test
    @DisplayName("Should return 404 for non-existent video")
    void getVideoByIdNotFound() throws Exception {
        // Given
        when(videoService.findVideoById(999L)).thenReturn(Optional.empty());

        // When/Then
        mockMvc.perform(get("/api/videos/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }    @Test
    @DisplayName("Should create new video")
    void createVideo() throws Exception {
        // Given
        String videoJson = "{\"title\":\"New Video\",\"description\":\"New Description\"}";
        
        VideoDTO newVideoDTO = new VideoDTO();
        newVideoDTO.setTitle("New Video");
        newVideoDTO.setDescription("New Description");
        
        // These stubbings are marked as lenient to avoid UnnecessaryStubbingException
        Mockito.lenient().when(objectMapper.readValue(anyString(), eq(VideoDTO.class))).thenReturn(newVideoDTO);
        Mockito.lenient().when(videoService.createVideo(any(VideoDTO.class))).thenReturn(testVideoDTO);

        // When/Then
        mockMvc.perform(post("/api/videos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(videoJson))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/videos/1"));
    }

    @Test
    @DisplayName("Should update video")
    void updateVideo() throws Exception {
        // Given
        String videoJson = "{\"title\":\"Updated Video\",\"description\":\"Updated Description\"}";
        
        when(videoService.findVideoById(1L)).thenReturn(Optional.of(testVideo));
        when(videoService.saveVideo(any(Video.class))).thenReturn(testVideo);

        // When/Then
        mockMvc.perform(put("/api/videos/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(videoJson))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should delete video")
    void deleteVideo() throws Exception {
        // Given
        when(videoService.findVideoById(1L)).thenReturn(Optional.of(testVideo));

        // When/Then
        mockMvc.perform(delete("/api/videos/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("Should return 404 when deleting non-existent video")
    void deleteVideoNotFound() throws Exception {
        // Given
        when(videoService.findVideoById(999L)).thenReturn(Optional.empty());

        // When/Then
        mockMvc.perform(delete("/api/videos/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should upload video file")
    void uploadVideoFile() throws Exception {
        // Given
        MockMultipartFile videoFile = new MockMultipartFile(
                "file", "test-video.mp4",
                "video/mp4", "test video content".getBytes());

        FileUploadResponse uploadResponse = new FileUploadResponse();
        uploadResponse.setFileName("test-video.mp4");
        uploadResponse.setFileUri("/uploads/videos/test-video.mp4");
        uploadResponse.setFileType("video/mp4");
        uploadResponse.setSize(18L);

        when(fileStorageService.storeVideoFile(any())).thenReturn(uploadResponse);        // When/Then
        mockMvc.perform(multipart("/api/videos/upload/file")
                .file(videoFile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName", is("test-video.mp4")))
                .andExpect(jsonPath("$.fileUri", is("/uploads/videos/test-video.mp4")));
    }    @Test
    @DisplayName("Should increment video view count")
    void incrementViewCount() throws Exception {
        // Given
        Video videoClone = new Video();
        videoClone.setId(1L);
        videoClone.setTitle("Test Video");
        videoClone.setDescription("Test Description");
        videoClone.setVideoUrl("/uploads/videos/test-video.mp4");
        videoClone.setThumbnailUrl("/uploads/thumbnails/test-thumbnail.jpg");
        videoClone.setViews(100L);
        videoClone.setLikes(50L);
        videoClone.setDuration(300);
        videoClone.setUploadDate(testVideo.getUploadDate());
        videoClone.setIsVisible(true);
        videoClone.setConversionStatus(ConversionStatus.COMPLETED);
        
        when(videoService.findVideoById(1L)).thenReturn(Optional.of(videoClone));

        // When/Then
        mockMvc.perform(post("/api/videos/1/view")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.views", is(101)));
    }
}
