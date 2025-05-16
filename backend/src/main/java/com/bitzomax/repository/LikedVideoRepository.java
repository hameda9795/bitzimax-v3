package com.bitzomax.repository;

import com.bitzomax.model.LikedVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for LikedVideo entity operations
 */
@Repository
public interface LikedVideoRepository extends JpaRepository<LikedVideo, Long> {
    
    /**
     * Find liked videos for a specific user
     * @param userId the user ID to search liked videos for
     * @return list of liked video entries for the specified user
     */
    List<LikedVideo> findByUserId(Long userId);
    
    /**
     * Find users who liked a specific video
     * @param videoId the video ID to find users who liked it
     * @return list of liked video entries for the specified video
     */
    List<LikedVideo> findByVideoId(Long videoId);
    
    /**
     * Find liked videos for a user ordered by liked date (most recent first)
     * @param userId the user ID to search liked videos for
     * @return list of liked video entries ordered by liked date
     */
    List<LikedVideo> findByUserIdOrderByLikedDateDesc(Long userId);
    
    /**
     * Find if a specific video is liked by a specific user
     * @param userId the user ID
     * @param videoId the video ID
     * @return optional containing the liked video entry if found
     */
    Optional<LikedVideo> findByUserIdAndVideoId(Long userId, Long videoId);
    
    /**
     * Count how many users liked a specific video
     * @param videoId the video ID
     * @return count of users who liked the video
     */
    long countByVideoId(Long videoId);
    
    /**
     * Find liked videos for a user within a date range
     * @param userId the user ID
     * @param startDate the start date
     * @param endDate the end date
     * @return list of liked video entries within the date range
     */
    List<LikedVideo> findByUserIdAndLikedDateBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
}
