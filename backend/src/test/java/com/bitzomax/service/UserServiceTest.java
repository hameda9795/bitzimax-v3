package com.bitzomax.service;

import com.bitzomax.dto.WatchHistoryDTO;
import com.bitzomax.model.*;
import com.bitzomax.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VideoRepository videoRepository;

    @Mock
    private FavoriteVideoRepository favoriteVideoRepository;

    @Mock
    private LikedVideoRepository likedVideoRepository;

    @Mock
    private WatchHistoryRepository watchHistoryRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private Video testVideo;
    private FavoriteVideo testFavoriteVideo;
    private LikedVideo testLikedVideo;
    private WatchHistory testWatchHistory;

    @BeforeEach
    void setUp() {
        // Set up test data
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

        testVideo = new Video();
        testVideo.setId(1L);
        testVideo.setTitle("Test Video");

        testFavoriteVideo = new FavoriteVideo();
        testFavoriteVideo.setId(1L);
        testFavoriteVideo.setUser(testUser);
        testFavoriteVideo.setVideo(testVideo);
        testFavoriteVideo.setAddedDate(LocalDateTime.now());

        testLikedVideo = new LikedVideo();
        testLikedVideo.setId(1L);
        testLikedVideo.setUser(testUser);
        testLikedVideo.setVideo(testVideo);
        testLikedVideo.setLikedDate(LocalDateTime.now());

        testWatchHistory = new WatchHistory();
        testWatchHistory.setId(1L);
        testWatchHistory.setUser(testUser);
        testWatchHistory.setVideo(testVideo);
        testWatchHistory.setTimestamp(LocalDateTime.now());
        testWatchHistory.setWatchDuration(120); // 2 minutes
    }

    @Test
    @DisplayName("Should get user by ID")
    void getCurrentUser() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        User result = userService.getCurrentUser(1L);

        // Then
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository, times(1)).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when getting non-existent user")
    void getCurrentUserNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // Then
        assertThrows(EntityNotFoundException.class, () -> {
            // When
            userService.getCurrentUser(999L);
        });
        verify(userRepository, times(1)).findById(999L);
    }

    @Test
    @DisplayName("Should add video to favorites")
    void addFavoriteVideo() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(videoRepository.findById(1L)).thenReturn(Optional.of(testVideo));
        when(favoriteVideoRepository.save(any(FavoriteVideo.class))).thenReturn(testFavoriteVideo);
        
        // When
        boolean result = userService.addFavoriteVideo(1L, 1L);
        
        // Then
        assertTrue(result);
        verify(userRepository, times(1)).findById(1L);
        verify(videoRepository, times(1)).findById(1L);
        verify(favoriteVideoRepository, times(1)).save(any(FavoriteVideo.class));
    }

    @Test
    @DisplayName("Should remove video from favorites")
    void removeFavoriteVideo() {
        // Given
        doNothing().when(favoriteVideoRepository).deleteByUserIdAndVideoId(1L, 1L);
        
        // When
        userService.removeFavoriteVideo(1L, 1L);
        
        // Then
        verify(favoriteVideoRepository, times(1)).deleteByUserIdAndVideoId(1L, 1L);
    }

    @Test
    @DisplayName("Should like a video")
    void likeVideo() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(videoRepository.findById(1L)).thenReturn(Optional.of(testVideo));
        when(likedVideoRepository.save(any(LikedVideo.class))).thenReturn(testLikedVideo);
        
        // When
        boolean result = userService.likeVideo(1L, 1L);
        
        // Then
        assertTrue(result);
        verify(userRepository, times(1)).findById(1L);
        verify(videoRepository, times(1)).findById(1L);
        verify(likedVideoRepository, times(1)).save(any(LikedVideo.class));
    }

    @Test
    @DisplayName("Should unlike a video")
    void unlikeVideo() {
        // Given
        when(likedVideoRepository.findByUserIdAndVideoId(1L, 1L)).thenReturn(Optional.of(testLikedVideo));
        doNothing().when(likedVideoRepository).delete(testLikedVideo);
        
        // When
        boolean result = userService.unlikeVideo(1L, 1L);
        
        // Then
        assertTrue(result);
        verify(likedVideoRepository, times(1)).findByUserIdAndVideoId(1L, 1L);
        verify(likedVideoRepository, times(1)).delete(testLikedVideo);
    }

    @Test
    @DisplayName("Should add watch history")
    void addWatchHistory() {        // Given
        WatchHistoryDTO watchHistoryDTO = new WatchHistoryDTO();
        watchHistoryDTO.setUserId(1L);
        watchHistoryDTO.setVideoId(1L);
        watchHistoryDTO.setWatchDuration(120);
        watchHistoryDTO.setCompleted(false);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(videoRepository.findById(1L)).thenReturn(Optional.of(testVideo));
        when(watchHistoryRepository.save(any(WatchHistory.class))).thenReturn(testWatchHistory);
          // When
        WatchHistoryDTO result = userService.addWatchHistory(watchHistoryDTO);
        
        // Then
        assertNotNull(result);
        verify(userRepository, times(1)).findById(1L);
        verify(videoRepository, times(1)).findById(1L);
        verify(watchHistoryRepository, times(1)).save(any(WatchHistory.class));
    }
}
