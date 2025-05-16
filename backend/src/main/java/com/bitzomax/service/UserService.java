package com.bitzomax.service;

import com.bitzomax.dto.WatchHistoryDTO;
import com.bitzomax.model.FavoriteVideo;
import com.bitzomax.model.LikedVideo;
import com.bitzomax.model.User;
import com.bitzomax.model.Video;
import com.bitzomax.model.WatchHistory;
import com.bitzomax.repository.FavoriteVideoRepository;
import com.bitzomax.repository.LikedVideoRepository;
import com.bitzomax.repository.UserRepository;
import com.bitzomax.repository.VideoRepository;
import com.bitzomax.repository.WatchHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service class for User-related operations
 */
@Service
public class UserService {
    
    private final UserRepository userRepository;
    private final VideoRepository videoRepository;
    private final FavoriteVideoRepository favoriteVideoRepository;
    private final LikedVideoRepository likedVideoRepository;
    private final WatchHistoryRepository watchHistoryRepository;
    
    @Autowired
    public UserService(
            UserRepository userRepository,
            VideoRepository videoRepository,
            FavoriteVideoRepository favoriteVideoRepository,
            LikedVideoRepository likedVideoRepository,
            WatchHistoryRepository watchHistoryRepository) {
        this.userRepository = userRepository;
        this.videoRepository = videoRepository;
        this.favoriteVideoRepository = favoriteVideoRepository;
        this.likedVideoRepository = likedVideoRepository;
        this.watchHistoryRepository = watchHistoryRepository;
    }
    
    /**
     * Get the current user by ID
     * 
     * @param userId the user ID
     * @return the user with the specified ID
     */
    public User getCurrentUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
    }
    
    /**
     * Add a video to user's favorites
     * 
     * @param userId the user ID
     * @param videoId the video ID to add to favorites
     * @return true if added successfully, false if already in favorites
     */
    @Transactional
    public boolean addToFavorites(Long userId, Long videoId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Video not found with id: " + videoId));
        
        // Check if video is already in favorites
        Optional<FavoriteVideo> existingFavorite = favoriteVideoRepository.findByUserIdAndVideoId(userId, videoId);
        if (existingFavorite.isPresent()) {
            return false; // Video already in favorites
        }
        
        // Add to favorites
        FavoriteVideo favoriteVideo = new FavoriteVideo();
        favoriteVideo.setUser(user);
        favoriteVideo.setVideo(video);
        favoriteVideo.setAddedDate(LocalDateTime.now());
        favoriteVideoRepository.save(favoriteVideo);
        
        return true;
    }
    
    /**
     * Remove a video from user's favorites
     * 
     * @param userId the user ID
     * @param videoId the video ID to remove from favorites
     * @return true if removed successfully, false if not in favorites
     */
    @Transactional
    public boolean removeFromFavorites(Long userId, Long videoId) {
        Optional<FavoriteVideo> existingFavorite = favoriteVideoRepository.findByUserIdAndVideoId(userId, videoId);
        if (existingFavorite.isEmpty()) {
            return false; // Video not in favorites
        }
        
        // Remove from favorites
        favoriteVideoRepository.delete(existingFavorite.get());
        return true;
    }
    
    /**
     * Check if a video is in user's favorites
     * 
     * @param userId the user ID
     * @param videoId the video ID to check
     * @return true if the video is in favorites, false otherwise
     */
    public boolean isInFavorites(Long userId, Long videoId) {
        return favoriteVideoRepository.findByUserIdAndVideoId(userId, videoId).isPresent();
    }
    
    /**
     * Toggle video like status
     * 
     * @param userId the user ID
     * @param videoId the video ID to toggle like status
     * @return true if the video is now liked, false if it was unliked
     */
    @Transactional
    public boolean toggleLike(Long userId, Long videoId) {
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Video not found with id: " + videoId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        Optional<LikedVideo> existingLike = likedVideoRepository.findByUserIdAndVideoId(userId, videoId);
        
        if (existingLike.isPresent()) {
            // Unlike: remove existing like
            likedVideoRepository.delete(existingLike.get());
            
            // Update video like count
            if (video.getLikes() > 0) {
                video.setLikes(video.getLikes() - 1);
                videoRepository.save(video);
            }
            
            return false; // Video is now unliked
        } else {
            // Like: add new like
            LikedVideo likedVideo = new LikedVideo();
            likedVideo.setUser(user);
            likedVideo.setVideo(video);
            likedVideo.setLikedDate(LocalDateTime.now());
            likedVideoRepository.save(likedVideo);
            
            // Update video like count
            video.setLikes(video.getLikes() + 1);
            videoRepository.save(video);
            
            return true; // Video is now liked
        }
    }
    
    /**
     * Track video watch progress
     * 
     * @param userId the user ID
     * @param videoId the video ID being watched
     * @param duration the watch duration in seconds
     * @param completed whether the video was watched to completion
     * @return the updated watch history entry
     */
    @Transactional
    public WatchHistoryDTO trackVideoWatch(Long userId, Long videoId, int duration, boolean completed) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new EntityNotFoundException("Video not found with id: " + videoId));
        
        // Check for existing watch history entry
        Optional<WatchHistory> existingHistoryOpt = watchHistoryRepository.findByUserIdAndVideoId(userId, videoId);
        
        WatchHistory watchHistory;
        if (existingHistoryOpt.isPresent()) {
            // Update existing entry
            watchHistory = existingHistoryOpt.get();
            watchHistory.setTimestamp(LocalDateTime.now());
            watchHistory.setWatchDuration(duration);
            watchHistory.setCompleted(completed);
        } else {
            // Create new entry
            watchHistory = new WatchHistory();
            watchHistory.setUser(user);
            watchHistory.setVideo(video);
            watchHistory.setTimestamp(LocalDateTime.now());
            watchHistory.setWatchDuration(duration);
            watchHistory.setCompleted(completed);
        }
        
        watchHistory = watchHistoryRepository.save(watchHistory);
        
        return WatchHistoryDTO.fromEntity(watchHistory);
    }
}
