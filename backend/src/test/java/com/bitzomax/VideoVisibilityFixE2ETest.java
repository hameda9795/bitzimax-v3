package com.bitzomax;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import com.bitzomax.service.VideoFixService;
import com.bitzomax.service.VideoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-end test for video visibility fixing flow
 * Uses the test profile for an isolated database environment
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class VideoVisibilityFixE2ETest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private VideoService videoService;

    @Autowired
    private VideoFixService videoFixService;    @Test
    @DisplayName("E2E test for video visibility fix workflow")
    @Transactional
    public void testVideoVisibilityFixWorkflow() throws Exception {        // 1. Create test videos with different visibility and conversion status
        Video video1 = createTestVideo("Test Video 1", ConversionStatus.COMPLETED, false);
        Video video2 = createTestVideo("Test Video 2", ConversionStatus.PROCESSING, false);
        Video video3 = createTestVideo("Test Video 3", ConversionStatus.COMPLETED, true);
        Video video4 = createTestVideo("Test Video 4", ConversionStatus.FAILED, false);
        
        // Save videos to repository
        videoRepository.save(video1);
        videoRepository.save(video2);
        videoRepository.save(video3);
        videoRepository.save(video4);
          // 2. Check initial state using REST API
        mockMvc.perform(get("/api/admin/videos/check"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCount", is(4)))
            .andExpect(jsonPath("$.visibleCount", is(1)))  // Only video3 is visible
            .andExpect(jsonPath("$.invisibleCount", is(3))); // video1, video2, video4 are invisible
        
        // 3. Call fix endpoint
        mockMvc.perform(post("/api/admin/videos/fix-visibility"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.fixedCount", is(2))); // Should fix video1 (completed) and video4 (null visibility)
          // 4. Check state after fix
        mockMvc.perform(get("/api/admin/videos/check"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCount", is(4)))
            .andExpect(jsonPath("$.visibleCount", is(3)))  // video1, video3, video4 should be visible
            .andExpect(jsonPath("$.invisibleCount", is(1))); // Only video2 should remain invisible
            
        // 5. Force all visible
        mockMvc.perform(post("/api/admin/videos/force-visible"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success", is(true)))
            .andExpect(jsonPath("$.fixedCount", is(1))); // Should fix video2
        
        // 6. Final state check
        mockMvc.perform(get("/api/admin/videos/check"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalCount", is(4)))
            .andExpect(jsonPath("$.visibleCount", is(4)))  // All videos should be visible
            .andExpect(jsonPath("$.nullVisibilityCount", is(0))); // No null visibility
    }
    
    @Test
    @DisplayName("E2E test for video creation and retrieval")
    @Transactional
    public void testVideoCreationAndRetrieval() throws Exception {
        // 1. Create a new video through the service
        Video video = new Video();
        video.setTitle("Integration Test Video");
        video.setDescription("Video created for integration testing");
        video.setVideoUrl("http://example.com/test-video.mp4");
        video.setThumbnailUrl("http://example.com/test-thumb.jpg");
        video.setIsPremium(true);
        video.setIsVisible(true);
        video.setConversionStatus(ConversionStatus.COMPLETED);
        video.setUploadDate(LocalDateTime.now());
        video.setDuration(300); // 5 minutes
        
        Video savedVideo = videoService.saveVideo(video);
        Long videoId = savedVideo.getId();
        
        // 2. Retrieve the video through the API
        mockMvc.perform(get("/api/videos/" + videoId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is(videoId.intValue())))
            .andExpect(jsonPath("$.title", is("Integration Test Video")))
            .andExpect(jsonPath("$.isPremium", is(true)))
            .andExpect(jsonPath("$.isVisible", is(true)));
        
        // 3. Update the video through the service
        video.setTitle("Updated Test Video");
        videoService.saveVideo(video);
        
        // 4. Verify the update through the API
        mockMvc.perform(get("/api/videos/" + videoId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", is(videoId.intValue())))
            .andExpect(jsonPath("$.title", is("Updated Test Video")));
        
        // 5. Delete the video
        mockMvc.perform(delete("/api/admin/videos/" + videoId))
            .andExpect(status().isOk());
        
        // 6. Verify deletion
        mockMvc.perform(get("/api/videos/" + videoId))
            .andExpect(status().isNotFound());
    }
    
    /**
     * Helper method to create a test video
     */
    private Video createTestVideo(String title, ConversionStatus status, Boolean isVisible) {
        Video video = new Video();
        video.setTitle(title);
        video.setDescription("Description for " + title);
        video.setVideoUrl("http://example.com/" + title.replace(" ", "-").toLowerCase() + ".mp4");
        video.setThumbnailUrl("http://example.com/" + title.replace(" ", "-").toLowerCase() + ".jpg");
        video.setConversionStatus(status);
        video.setIsVisible(isVisible);
        video.setIsPremium(false);
        video.setUploadDate(LocalDateTime.now());
        video.setViews(0L);
        video.setLikes(0L);
        video.setDuration(120);
        return video;
    }
}
