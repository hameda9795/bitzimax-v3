package com.bitzomax.repository;

import com.bitzomax.model.FavoriteVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for FavoriteVideo entity operations
 */
@Repository
public interface FavoriteVideoRepository extends JpaRepository<FavoriteVideo, Long> {
    
    /**
     * Find favorite videos for a specific user
     * @param userId the user ID to search favorite videos for
     * @return list of favorite video entries for the specified user
     */
    List<FavoriteVideo> findByUserId(Long userId);
    
    /**
     * Find users who favorited a specific video
     * @param videoId the video ID to find users who favorited it
     * @return list of favorite video entries for the specified video
     */
    List<FavoriteVideo> findByVideoId(Long videoId);
    
    /**
     * Find favorite videos for a user ordered by added date (most recent first)
     * @param userId the user ID to search favorite videos for
     * @return list of favorite video entries ordered by added date
     */
    List<FavoriteVideo> findByUserIdOrderByAddedDateDesc(Long userId);
    
    /**
     * Find if a specific video is favorited by a specific user
     * @param userId the user ID
     * @param videoId the video ID
     * @return optional containing the favorite video entry if found
     */
    Optional<FavoriteVideo> findByUserIdAndVideoId(Long userId, Long videoId);
    
    /**
     * Count how many users favorited a specific video
     * @param videoId the video ID
     * @return count of users who favorited the video
     */
    long countByVideoId(Long videoId);
    
    /**
     * Find favorite videos for a user added within a date range
     * @param userId the user ID
     * @param startDate the start date
     * @param endDate the end date
     * @return list of favorite video entries within the date range
     */
    List<FavoriteVideo> findByUserIdAndAddedDateBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Delete a favorite video entry by user ID and video ID
     * @param userId the user ID
     * @param videoId the video ID
     */
    void deleteByUserIdAndVideoId(Long userId, Long videoId);
}
