package com.bitzomax.repository;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for Video entity operations
 */
@Repository
public interface VideoRepository extends JpaRepository<Video, Long> {
    
    /**
     * Find all videos ordered by upload date (newest first)
     * @return list of videos ordered by upload date descending
     */
    List<Video> findAllByOrderByUploadDateDesc();
    
    /**
     * Find all videos filtered by premium status
     * @param isPremium boolean to filter premium or free videos
     * @return list of videos based on premium status
     */
    List<Video> findAllByIsPremium(boolean isPremium);
    
    /**
     * Find all videos ordered by view count (most popular first)
     * @return list of videos ordered by views descending
     */
    List<Video> findAllByOrderByViewsDesc();
    
    /**
     * Find all videos containing a specific tag
     * @param tag the tag to search for
     * @return list of videos containing the specified tag
     */
    List<Video> findByTagsContaining(String tag);
    
    /**
     * Find all videos containing a specific hashtag
     * @param hashtag the hashtag to search for
     * @return list of videos containing the specified hashtag
     */
    List<Video> findByHashtagsContaining(String hashtag);
    
    /**
     * Find videos with pagination support ordered by upload date
     * @param pageable pagination information
     * @return page of videos
     */
    Page<Video> findAllByOrderByUploadDateDesc(Pageable pageable);
    
    /**
     * Find videos with pagination support ordered by views
     * @param pageable pagination information
     * @return page of videos
     */
    Page<Video> findAllByOrderByViewsDesc(Pageable pageable);
    
    /**
     * Find videos by conversion status
     * @param status the conversion status to filter by
     * @return list of videos with the specified conversion status
     */
    List<Video> findByConversionStatus(ConversionStatus status);
    
    /**
     * Search videos by title or description containing the search term
     * @param searchTerm the term to search for in title or description
     * @return list of videos matching the search term
     */
    @Query("SELECT v FROM Video v WHERE LOWER(v.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(v.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Video> searchByTitleOrDescription(@Param("searchTerm") String searchTerm);
    
    /**
     * Find videos uploaded within a date range
     * @param startDate the start date of the range
     * @param endDate the end date of the range
     * @return list of videos uploaded within the date range
     */
    List<Video> findByUploadDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find all visible videos
     * @return list of visible videos
     */
    List<Video> findByIsVisibleTrue();
    
    /**
     * Find visible videos with pagination
     * @param pageable pagination information
     * @return page of visible videos
     */
    Page<Video> findByIsVisibleTrue(Pageable pageable);
    
    /**
     * Custom query to find videos with specific criteria
     * @return list of completed and visible videos
     */    @Query("SELECT v FROM Video v WHERE v.isVisible = true AND v.conversionStatus = 'COMPLETED'")
    List<Video> findAllCompletedAndVisibleVideos();
    
    /**
     * Find all videos by genre ID
     * @param genreId the genre ID to filter by
     * @return list of videos belonging to the specified genre
     */
    List<Video> findByGenreIdAndIsVisibleTrue(Long genreId);
    
    /**
     * Find videos by genre ID with pagination
     * @param genreId the genre ID to filter by
     * @param pageable pagination information
     * @return page of videos belonging to the specified genre
     */
    Page<Video> findByGenreIdAndIsVisibleTrue(Long genreId, Pageable pageable);
}
