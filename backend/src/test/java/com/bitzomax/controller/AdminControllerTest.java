package com.bitzomax.controller;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import com.bitzomax.service.VideoFixService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    private MockMvc mockMvc;

    @Mock
    private VideoRepository videoRepository;

    @Mock
    private VideoFixService videoFixService;

    @InjectMocks
    private AdminController adminController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
    }

    @Test
    @DisplayName("Should check video visibility status")
    void checkVideoVisibility() throws Exception {
        // Given
        Video video1 = new Video();
        video1.setId(1L);
        video1.setTitle("Video 1");
        video1.setConversionStatus(ConversionStatus.COMPLETED);
        video1.setIsVisible(true);

        Video video2 = new Video();
        video2.setId(2L);
        video2.setTitle("Video 2");
        video2.setConversionStatus(ConversionStatus.PROCESSING);
        video2.setIsVisible(false);

        Video video3 = new Video();
        video3.setId(3L);
        video3.setTitle("Video 3");
        video3.setConversionStatus(ConversionStatus.COMPLETED);
        video3.setIsVisible(null);

        List<Video> videos = Arrays.asList(video1, video2, video3);        when(videoRepository.findAll()).thenReturn(videos);

        // When & Then
        mockMvc.perform(get("/api/admin/videos/check"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount", is(3)))
                .andExpect(jsonPath("$.visibleCount", is(1)))
                .andExpect(jsonPath("$.invisibleCount", is(1))) // Fixed property name to match controller
                .andExpect(jsonPath("$.nullVisibilityCount", is(1)))
                .andExpect(jsonPath("$.videos", hasSize(3)))
                .andExpect(jsonPath("$.videos[0].id", is(1)))
                .andExpect(jsonPath("$.videos[0].title", is("Video 1")))
                .andExpect(jsonPath("$.videos[0].status", is("COMPLETED")))
                .andExpect(jsonPath("$.videos[0].isVisible", is(true)));

        verify(videoRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should fix video visibility issues")
    void fixVideoVisibility() throws Exception {
        // Given
        when(videoFixService.fixVideoVisibility()).thenReturn(2);

        // When & Then
        mockMvc.perform(post("/api/admin/videos/fix-visibility"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Fixed visibility for 2 videos")))
                .andExpect(jsonPath("$.fixedCount", is(2)));

        verify(videoFixService, times(1)).fixVideoVisibility();
    }

    @Test
    @DisplayName("Should force all videos to be visible")
    void forceAllVideosVisible() throws Exception {
        // Given
        when(videoFixService.forceAllVideosVisible()).thenReturn(3);

        // When & Then
        mockMvc.perform(post("/api/admin/videos/force-visible"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Made 3 videos visible")))
                .andExpect(jsonPath("$.fixedCount", is(3)));

        verify(videoFixService, times(1)).forceAllVideosVisible();
    }
}
