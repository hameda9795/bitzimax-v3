package com.bitzomax.service;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import com.bitzomax.mapper.VideoMapper;
import com.bitzomax.dto.VideoDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class VideoService {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoService.class);
    
    @Autowired
    private VideoRepository videoRepository;
    
    @Autowired
    private VideoMapper videoMapper;
    
    public List<Video> getAllVideos(boolean includeHidden) {
        logger.debug("Fetching all videos, includeHidden={}", includeHidden);
        List<Video> videos;
        if (includeHidden) {
            videos = videoRepository.findAll();
        } else {
            videos = videoRepository.findByIsVisibleTrue();
            // Double-check for null visibility values
            videos = videos.stream()
                .filter(v -> v.getIsVisible() != null && v.getIsVisible())
                .toList();
        }
        logger.info("Found {} videos (includeHidden={})", videos.size(), includeHidden);
        return videos;
    }
    
    public Page<Video> getPagedVideos(Pageable pageable, boolean includeHidden) {
        logger.debug("Fetching paged videos, page={}, size={}, includeHidden={}", 
                pageable.getPageNumber(), pageable.getPageSize(), includeHidden);
        if (includeHidden) {
            return videoRepository.findAll(pageable);
        } else {
            return videoRepository.findByIsVisibleTrue(pageable);
        }
    }
    
    public Optional<Video> findVideoById(Long id) {
        logger.debug("Finding video by ID: {}", id);
        return videoRepository.findById(id);
    }
    
    @Transactional
    public Video saveVideo(Video video) {
        logger.debug("Saving new video: {}", video.getTitle());
        // Set defaults if not provided
        if (video.getConversionStatus() == null) {
            video.setConversionStatus(ConversionStatus.PENDING);
        }
        if (video.getIsVisible() == null) {
            video.setIsVisible(true);
        }
        
        return videoRepository.save(video);
    }
    
    @Transactional
    public void updateVideoVisibility(Long id, boolean isVisible) {
        logger.debug("Updating video visibility, id={}, isVisible={}", id, isVisible);
        Optional<Video> videoOpt = videoRepository.findById(id);
        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();
            video.setIsVisible(isVisible);
            videoRepository.save(video);
        } else {
            logger.warn("Video not found with ID: {}", id);
        }
    }
    
    @Transactional
    public void updateVideoConversionStatus(Long id, ConversionStatus status) {
        logger.debug("Updating video conversion status, id={}, status={}", id, status);
        Optional<Video> videoOpt = videoRepository.findById(id);
        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();
            video.setConversionStatus(status);
            
            // Automatically set visibility based on conversion status
            if (status == ConversionStatus.COMPLETED) {
                video.setIsVisible(true);
            } else if (status == ConversionStatus.FAILED) {
                video.setIsVisible(false);
            }
            
            videoRepository.save(video);
        } else {
            logger.warn("Video not found with ID: {}", id);
        }
    }
    
    /**
     * Find all videos by genre ID
     * @param genreId the genre ID to filter by
     * @return list of videos belonging to the specified genre
     */
    public List<Video> getVideosByGenreId(Long genreId) {
        logger.debug("Fetching videos by genre ID: {}", genreId);
        return videoRepository.findByGenreIdAndIsVisibleTrue(genreId);
    }
    
    /**
     * Find videos by genre ID with pagination
     * @param genreId the genre ID to filter by
     * @param pageable pagination information
     * @return page of videos belonging to the specified genre
     */
    public Page<Video> getPagedVideosByGenreId(Long genreId, Pageable pageable) {
        logger.debug("Fetching paged videos by genre ID: {}, page={}, size={}", 
                genreId, pageable.getPageNumber(), pageable.getPageSize());
        return videoRepository.findByGenreIdAndIsVisibleTrue(genreId, pageable);
    }
    
    @Transactional
    public void deleteVideo(Long id) {
        logger.debug("Deleting video with ID: {}", id);
        videoRepository.deleteById(id);
    }
    
    /**
     * Create a new video from DTO
     */
    @Transactional
    public VideoDTO createVideo(VideoDTO videoDTO) {
        logger.debug("Creating new video from DTO: {}", videoDTO.getTitle());
        
        // Set defaults
        if (videoDTO.getConversionStatus() == null) {
            videoDTO.setConversionStatus(ConversionStatus.COMPLETED);
        }
        
        if (videoDTO.getIsVisible() == null) {
            videoDTO.setIsVisible(true);
        }
        
        // Convert DTO to entity
        Video video = videoMapper.toEntity(videoDTO);
        
        // Save entity
        Video savedVideo = videoRepository.save(video);
        
        // Return as DTO
        return videoMapper.toDto(savedVideo);
    }
    
    /**
     * Get a video by ID and return as DTO
     */
    public VideoDTO getVideoById(Long id) {
        logger.debug("Getting video by ID as DTO: {}", id);
        return videoRepository.findById(id)
            .map(videoMapper::toDto)
            .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Video not found with ID: " + id));
    }
    
    /**
     * Update an existing video from DTO
     */
    @Transactional
    public VideoDTO updateVideo(Long id, VideoDTO videoDTO) {
        logger.debug("Updating video with ID: {}", id);
        
        Video existingVideo = videoRepository.findById(id)
            .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Video not found with ID: " + id));
        
        // Update fields from DTO
        if (videoDTO.getTitle() != null) existingVideo.setTitle(videoDTO.getTitle());
        if (videoDTO.getDescription() != null) existingVideo.setDescription(videoDTO.getDescription());
        if (videoDTO.getThumbnailUrl() != null) existingVideo.setThumbnailUrl(videoDTO.getThumbnailUrl());
        if (videoDTO.getVideoUrl() != null) existingVideo.setVideoUrl(videoDTO.getVideoUrl());
        if (videoDTO.getDuration() != null) existingVideo.setDuration(videoDTO.getDuration());
        if (videoDTO.getIsPremium() != null) existingVideo.setIsPremium(videoDTO.getIsPremium());
        if (videoDTO.getPoemText() != null) existingVideo.setPoemText(videoDTO.getPoemText());
        if (videoDTO.getSeoTitle() != null) existingVideo.setSeoTitle(videoDTO.getSeoTitle());
        if (videoDTO.getSeoDescription() != null) existingVideo.setSeoDescription(videoDTO.getSeoDescription());
        if (videoDTO.getConversionStatus() != null) existingVideo.setConversionStatus(videoDTO.getConversionStatus());
        if (videoDTO.getIsVisible() != null) existingVideo.setIsVisible(videoDTO.getIsVisible());
        
        // Special case for collections - only update if not null and not empty
        if (videoDTO.getTags() != null && !videoDTO.getTags().isEmpty()) existingVideo.setTags(videoDTO.getTags());
        if (videoDTO.getHashtags() != null && !videoDTO.getHashtags().isEmpty()) existingVideo.setHashtags(videoDTO.getHashtags());
        if (videoDTO.getSeoKeywords() != null && !videoDTO.getSeoKeywords().isEmpty()) existingVideo.setSeoKeywords(videoDTO.getSeoKeywords());
        
        // Update genre if provided
        if (videoDTO.getGenre() != null && videoDTO.getGenre().getId() != null) {
            existingVideo.getGenre().setId(videoDTO.getGenre().getId());
            if (videoDTO.getGenre().getName() != null) {
                existingVideo.getGenre().setName(videoDTO.getGenre().getName());
            }
        }
        
        // Save updated entity
        Video savedVideo = videoRepository.save(existingVideo);
        
        // Return as DTO
        return videoMapper.toDto(savedVideo);
    }
    
    /**
     * Get all videos with pagination
     */
    public Page<VideoDTO> getAllVideosWithPagination(Pageable pageable) {
        logger.debug("Getting all videos with pagination");
        Page<Video> videoPage = videoRepository.findAll(pageable);
        return videoPage.map(videoMapper::toDto);
    }
    
    /**
     * Find related videos based on shared tags
     */
    public List<Video> findRelatedVideos(Video video, int limit) {
        logger.debug("Finding related videos for video ID: {}, limit: {}", video.getId(), limit);
        
        // This is a simple approach; in a real app, we would use:
        // 1. First try videos with same genre + overlapping tags
        // 2. Then try videos with same genre
        // 3. Then try videos with overlapping tags
        // 4. Finally just return popular videos
        
        // For now, we'll just return other visible videos, excluding the current one
        List<Video> allVideos = videoRepository.findByIsVisibleTrue();
        return allVideos.stream()
            .filter(v -> !v.getId().equals(video.getId()))
            .sorted((v1, v2) -> Long.compare(v2.getViews(), v1.getViews()))
            .limit(limit)
            .toList();
    }
}