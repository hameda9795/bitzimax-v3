package com.bitzomax.controller;

import com.bitzomax.dto.WatchHistoryDTO;
import com.bitzomax.model.User;
import com.bitzomax.model.Video;
import com.bitzomax.model.WatchHistory;
import com.bitzomax.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private User testUser;
    private WatchHistory testWatchHistory;
    private WatchHistoryDTO testWatchHistoryDTO;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(userController)
                .build();

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setDisplayName("Test User");
        testUser.setJoinDate(LocalDateTime.now());
        testUser.setIsSubscribed(false);
        testUser.setAvatarUrl("/assets/images/default-avatar.jpg");
        testUser.setFavoriteVideos(new ArrayList<>());
        testUser.setLikedVideos(new ArrayList<>());
        testUser.setWatchHistory(new ArrayList<>());

        Video testVideo = new Video();
        testVideo.setId(1L);
        testVideo.setTitle("Test Video");

        testWatchHistory = new WatchHistory();
        testWatchHistory.setId(1L);
        testWatchHistory.setUser(testUser);
        testWatchHistory.setVideo(testVideo);
        testWatchHistory.setTimestamp(LocalDateTime.now());
        testWatchHistory.setWatchDuration(120);

        testWatchHistoryDTO = new WatchHistoryDTO();
        testWatchHistoryDTO.setUserId(1L);
        testWatchHistoryDTO.setVideoId(1L);
        testWatchHistoryDTO.setWatchDuration(120);
    }

    @Test
    @DisplayName("Should get current user")
    void getCurrentUser() throws Exception {
        // Given
        when(userService.getCurrentUser(1L)).thenReturn(testUser);

        // When/Then
        mockMvc.perform(get("/api/users/current")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.username", is("testuser")))
                .andExpect(jsonPath("$.email", is("test@example.com")));
    }

    @Test
    @DisplayName("Should handle exception when getting current user")
    void getCurrentUserException() throws Exception {
        // Given
        when(userService.getCurrentUser(1L)).thenThrow(new RuntimeException("User not found"));

        // When/Then - Should return fallback demo user
        mockMvc.perform(get("/api/users/current")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.username", is("demo_user")));
    }

    @Test
    @DisplayName("Should add video to favorites")
    void addFavoriteVideo() throws Exception {
        // Given
        when(userService.addFavoriteVideo(1L, 1L)).thenReturn(true);

        // When/Then
        mockMvc.perform(post("/api/users/1/favorites/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Should remove video from favorites")
    void removeFavoriteVideo() throws Exception {
        // Given
        // No stubbing needed for void methods

        // When/Then
        mockMvc.perform(delete("/api/users/1/favorites/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Should like a video")
    void likeVideo() throws Exception {
        // Given
        when(userService.likeVideo(1L, 1L)).thenReturn(true);

        // When/Then
        mockMvc.perform(post("/api/users/1/likes/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("Should unlike a video")
    void unlikeVideo() throws Exception {
        // Given
        when(userService.unlikeVideo(1L, 1L)).thenReturn(true);

        // When/Then
        mockMvc.perform(delete("/api/users/1/likes/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }    @Test
    @DisplayName("Should add watch history")
    void addWatchHistory() throws Exception {        // Given
        String watchHistoryJson = "{\"userId\":1,\"videoId\":1,\"watchDuration\":120,\"completed\":false}";
        WatchHistoryDTO watchHistoryDTO = new WatchHistoryDTO();
        watchHistoryDTO.setId(1L);
        watchHistoryDTO.setUserId(1L);
        watchHistoryDTO.setVideoId(1L);
        watchHistoryDTO.setWatchDuration(120);
        watchHistoryDTO.setCompleted(false);
        watchHistoryDTO.setTimestamp(LocalDateTime.now());
        Mockito.lenient().when(userService.addWatchHistory(any(WatchHistoryDTO.class))).thenReturn(watchHistoryDTO);// When/Then
        mockMvc.perform(post("/api/users/1/watch-history") // Changed to match the actual controller endpoint
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-User-ID", "1")
                .content(watchHistoryJson))
                .andExpect(status().isOk());
    }    @Test
    @DisplayName("Should handle error when adding watch history")
    void addWatchHistoryError() throws Exception {
        // Given
        String watchHistoryJson = "{\"userId\":1,\"videoId\":1,\"watchDuration\":120}";
        Mockito.lenient().when(userService.addWatchHistory(any(WatchHistoryDTO.class)))
                .thenThrow(new RuntimeException("Error adding watch history"));// When/Then
        mockMvc.perform(post("/api/users/1/watch-history") // Changed to match the actual controller endpoint
                .contentType(MediaType.APPLICATION_JSON)
                .content(watchHistoryJson))
                .andExpect(status().isBadRequest());
    }
}
