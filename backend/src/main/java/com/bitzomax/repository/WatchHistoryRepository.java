package com.bitzomax.repository;

import com.bitzomax.model.WatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for WatchHistory entity operations
 */
@Repository
public interface WatchHistoryRepository extends JpaRepository<WatchHistory, Long> {
    
    /**
     * Find watch history entries for a specific user
     * @param userId the user ID to search watch history for
     * @return list of watch history entries for the specified user
     */
    List<WatchHistory> findByUserId(Long userId);
    
    /**
     * Find watch history entries for a specific video
     * @param videoId the video ID to search watch history for
     * @return list of watch history entries for the specified video
     */
    List<WatchHistory> findByVideoId(Long videoId);
    
    /**
     * Find watch history entries for a specific user ordered by timestamp (most recent first)
     * @param userId the user ID to search watch history for
     * @return list of watch history entries for the specified user ordered by timestamp
     */
    List<WatchHistory> findByUserIdOrderByTimestampDesc(Long userId);
    
    /**
     * Find completed watch history entries for a specific user
     * @param userId the user ID to search completed watch history for
     * @param completed whether the video was completed or not
     * @return list of completed watch history entries for the specified user
     */
    List<WatchHistory> findByUserIdAndCompleted(Long userId, boolean completed);
    
    /**
     * Find a watch history entry for a specific user and video
     * @param userId the user ID
     * @param videoId the video ID
     * @return Optional containing the watch history entry if found
     */
    Optional<WatchHistory> findByUserIdAndVideoId(Long userId, Long videoId);
    
    /**
     * Find watch history entries for a specific user within a date range
     * @param userId the user ID to search watch history for
     * @param startDate the start date of the range
     * @param endDate the end date of the range
     * @return list of watch history entries for the specified user within the date range
     */
    List<WatchHistory> findByUserIdAndTimestampBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
}
