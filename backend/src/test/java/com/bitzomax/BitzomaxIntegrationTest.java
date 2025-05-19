package com.bitzomax;

import com.bitzomax.controller.VideoController;
import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import com.bitzomax.service.FileStorageService;
import com.bitzomax.service.VideoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for the Bitzomax application
 * Uses @ActiveProfiles("test") to use test-specific configuration
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class BitzomaxIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private VideoService videoService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private VideoController videoController;

    @Test
    @DisplayName("Context loads successfully")
    void contextLoads() {
        // Verify that the context loads
        assertNotNull(mockMvc);
        assertNotNull(videoRepository);
        assertNotNull(videoService);
        assertNotNull(fileStorageService);
        assertNotNull(videoController);
    }

    @Test
    @DisplayName("Video API endpoints are accessible")
    void apiEndpointsAreAccessible() throws Exception {
        // Test GET /api/videos endpoint
        mockMvc.perform(get("/api/videos"))
                .andExpect(status().isOk());
    }

    @Test
    @Transactional
    @DisplayName("Video service operations work with repository")
    void videoServiceOperationsWork() {
        // Get initial video count
        long initialCount = videoRepository.count();

        // Create a test video
        Video video = new Video();
        video.setTitle("Integration Test Video");
        video.setDescription("This is a test video for integration testing");
        video.setVideoUrl("http://example.com/test.mp4");
        video.setThumbnailUrl("http://example.com/test.jpg");
        video.setViews(0L);
        video.setLikes(0L);
        video.setIsVisible(true);
        video.setIsPremium(false);

        // Save the video using the service
        Video savedVideo = videoService.saveVideo(video);
        
        // Verify video was saved
        assertNotNull(savedVideo.getId());
        assertEquals("Integration Test Video", savedVideo.getTitle());
        
        // Verify count increased
        assertEquals(initialCount + 1, videoRepository.count());
        
        // Test retrieval
        Optional<Video> retrievedVideo = videoService.findVideoById(savedVideo.getId());
        assertTrue(retrievedVideo.isPresent());
        assertEquals("Integration Test Video", retrievedVideo.get().getTitle());
        
        // Test paged retrieval
        Pageable pageable = PageRequest.of(0, 10);
        assertTrue(videoService.getPagedVideos(pageable, true).getContent().size() > 0);
        
        // Test visibility filter
        List<Video> visibleVideos = videoService.getAllVideos(false);
        assertTrue(visibleVideos.stream().allMatch(v -> v.getIsVisible() == null || v.getIsVisible()));
    }
}
