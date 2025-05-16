package com.bitzomax.controller;

import com.bitzomax.dto.WatchHistoryDTO;
import com.bitzomax.model.User;
import com.bitzomax.service.UserService;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for handling user-related endpoints
 */
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * Get current user profile
     * GET /users/profile
     * 
     * @param userId the authenticated user ID (from auth token)
     * @return the user profile
     */
    @GetMapping("/profile")
    public ResponseEntity<User> getCurrentUserProfile(@RequestHeader("X-User-ID") Long userId) {
        User user = userService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }
      /**
     * Get current user (for frontend compatibility)
     * GET /api/users/current
     * 
     * @return the current user
     */
    @GetMapping("/current")
    public ResponseEntity<User> getCurrentUser() {
        try {
            // For development, return a default user
            // In production, this would use authentication to get the current user
            Long demoUserId = 1L; // Use a default ID for development
            User user = userService.getCurrentUser(demoUserId);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            // Create a demo user if one doesn't exist
            User demoUser = new User();
            demoUser.setId(1L);
            demoUser.setUsername("demo_user");
            demoUser.setEmail("demo@bitzomax.com");
            demoUser.setDisplayName("Demo User");
            demoUser.setJoinDate(java.time.LocalDateTime.now());
            demoUser.setIsSubscribed(true);
            demoUser.setAvatarUrl("/assets/images/avatar.jpg");
            demoUser.setLikedVideos(new ArrayList<>());
            demoUser.setFavoriteVideos(new ArrayList<>());
            demoUser.setWatchHistory(new ArrayList<>());
            return ResponseEntity.ok(demoUser);
        }
    }
    
    /**
     * Add a video to favorites
     * POST /users/favorites/{videoId}
     * 
     * @param videoId the video ID to add to favorites
     * @param userId the authenticated user ID (from auth token)
     * @return success status
     */
    @PostMapping("/favorites/{videoId}")
    public ResponseEntity<Boolean> addToFavorites(
            @PathVariable Long videoId,
            @RequestHeader("X-User-ID") Long userId) {
        boolean success = userService.addToFavorites(userId, videoId);
        return ResponseEntity.ok(success);
    }
    
    /**
     * Remove a video from favorites
     * DELETE /users/favorites/{videoId}
     * 
     * @param videoId the video ID to remove from favorites
     * @param userId the authenticated user ID (from auth token)
     * @return success status
     */
    @DeleteMapping("/favorites/{videoId}")
    public ResponseEntity<Boolean> removeFromFavorites(
            @PathVariable Long videoId,
            @RequestHeader("X-User-ID") Long userId) {
        boolean success = userService.removeFromFavorites(userId, videoId);
        return ResponseEntity.ok(success);
    }
    
    /**
     * Record watch history
     * POST /users/watch-history
     * 
     * @param watchHistoryDTO the watch history data
     * @param userId the authenticated user ID (from auth token)
     * @return the created/updated watch history entry
     */
    @PostMapping("/watch-history")
    public ResponseEntity<WatchHistoryDTO> recordWatchHistory(
            @RequestBody WatchHistoryDTO watchHistoryDTO,
            @RequestHeader("X-User-ID") Long userId) {
        WatchHistoryDTO savedHistory = userService.trackVideoWatch(
                userId,
                watchHistoryDTO.getVideoId(),
                watchHistoryDTO.getWatchDuration(),
                watchHistoryDTO.getCompleted());
                
        return ResponseEntity.ok(savedHistory);
    }
}
