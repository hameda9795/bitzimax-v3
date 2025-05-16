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

import java.time.LocalDateTime;
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
        if (video.getUploadDate() == null) {
            video.setUploadDate(LocalDateTime.now());
        }
        if (video.getViews() == null) {
            video.setViews(0L);
        }
        if (video.getLikes() == null) {
            video.setLikes(0L);
        }
        if (video.getCommentCount() == null) {
            video.setCommentCount(0L);
        }
        if (video.getShareCount() == null) {
            video.setShareCount(0L);
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
    
    @Transactional
    public void deleteVideo(Long id) {
        logger.debug("Deleting video with ID: {}", id);
        videoRepository.deleteById(id);
    }
    
    /**
     * Create a new video from DTO
     */    @Transactional
    public VideoDTO createVideo(VideoDTO videoDTO) {
        logger.debug("Creating new video from DTO: {}", videoDTO.getTitle());
        
        // Set defaults
        if (videoDTO.getConversionStatus() == null) {
            videoDTO.setConversionStatus(ConversionStatus.COMPLETED);
        }
        
        videoDTO.setIsVisible(true); // Ensure newly created videos are always marked as visible
        
        // Always ensure uploadDate is set for new videos
        if (videoDTO.getUploadDate() == null) {
            videoDTO.setUploadDate(LocalDateTime.now());
        }
        
        // Initialize counters
        if (videoDTO.getViews() == null) videoDTO.setViews(0L);
        if (videoDTO.getLikes() == null) videoDTO.setLikes(0L);
        if (videoDTO.getCommentCount() == null) videoDTO.setCommentCount(0L);
        if (videoDTO.getShareCount() == null) videoDTO.setShareCount(0L);
        
        // Convert DTO to entity
        Video video = videoMapper.toEntity(videoDTO);
        
        // Save the video
        Video savedVideo = videoRepository.save(video);
        logger.info("Saved new video: {} (ID: {})", savedVideo.getTitle(), savedVideo.getId());
        
        // Convert back to DTO and return
        return videoMapper.toDto(savedVideo);
    }
}
