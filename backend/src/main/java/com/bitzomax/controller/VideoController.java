package com.bitzomax.controller;

import com.bitzomax.dto.FileUploadResponse;
import com.bitzomax.dto.VideoDTO;
import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.service.FileStorageService;
import com.bitzomax.service.VideoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.DeserializationFeature;
import java.io.IOException;

import java.util.List;
import java.util.Optional;

/**
 * REST controller for handling video-related endpoints
 */
@RestController
@RequestMapping("/api/videos")
public class VideoController {    private static final Logger logger = LoggerFactory.getLogger(VideoController.class);

    private final VideoService videoService;
    private final FileStorageService fileStorageService;

    @Autowired
    public VideoController(VideoService videoService, FileStorageService fileStorageService) {
        this.videoService = videoService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Get all videos
     * GET /videos
     *
     * @param includeHidden whether to include hidden videos
     * @param userId the authenticated user ID (from auth token)
     * @return list of all videos
     */
    @GetMapping
    public ResponseEntity<List<Video>> getAllVideos(
            @RequestParam(defaultValue = "false") boolean includeHidden,
            @RequestHeader(value = "X-User-ID", required = false) Long userId) {
        boolean isAdmin = userId != null; // This is temporary - implement proper admin check
        boolean showHidden = isAdmin && includeHidden;

        logger.info("Fetching all videos, userId={}, showHidden={}", userId, showHidden);
        List<Video> videos = videoService.getAllVideos(showHidden);
        return ResponseEntity.ok(videos);
    }

    /**
     * Get paged videos
     * GET /videos/page
     *
     * @param page the page number
     * @param size the page size
     * @param sort the sort field
     * @param direction the sort direction
     * @param includeHidden whether to include hidden videos
     * @param userId the authenticated user ID (from auth token)
     * @return paged list of videos
     */
    @GetMapping("/page")
    public ResponseEntity<Page<Video>> getPagedVideos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "uploadDate") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(defaultValue = "false") boolean includeHidden,
            @RequestHeader(value = "X-User-ID", required = false) Long userId) {

        boolean isAdmin = userId != null; // This is temporary - implement proper admin check
        boolean showHidden = isAdmin && includeHidden;

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ?
                Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, sortDirection, sort);

        logger.info("Fetching paged videos, page={}, size={}, sort={}, userId={}, showHidden={}",
                page, size, sort + " " + direction, userId, showHidden);

        Page<Video> videos = videoService.getPagedVideos(pageable, showHidden);
        return ResponseEntity.ok(videos);
    }

    /**
     * Get video by ID
     * GET /videos/{id}
     *
     * @param id the video ID
     * @return the video with the specified ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getVideoById(@PathVariable Long id) {
        logger.info("Fetching video with id: {}", id);
        Optional<Video> videoOpt = videoService.findVideoById(id);

        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();

            if (!video.getIsVisible()) {
                logger.warn("Attempt to access non-visible video: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found");
            }

            return ResponseEntity.ok(video);
        } else {
            logger.warn("Video not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found");
        }
    }

    /**
     * Create a new video
     * POST /videos
     *
     * @param video the video details
     * @return the created video
     */    @PostMapping
    public ResponseEntity<Video> createVideo(@RequestBody Video video) {
        logger.info("Creating new video: {}", video.getTitle());
        Video savedVideo = videoService.saveVideo(video);
        return new ResponseEntity<>(savedVideo, HttpStatus.CREATED);
    }

    /**
     * Update video details
     * PUT /videos/{id}
     *
     * @param id the video ID
     * @param videoDetails the updated video details
     * @return the updated video
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVideo(@PathVariable Long id, @RequestBody Video videoDetails) {
        logger.info("Updating video with id: {}", id);
        Optional<Video> videoOpt = videoService.findVideoById(id);

        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();

            video.setTitle(videoDetails.getTitle());
            video.setDescription(videoDetails.getDescription());
            video.setVideoUrl(videoDetails.getVideoUrl());
            video.setThumbnailUrl(videoDetails.getThumbnailUrl());
            video.setIsPremium(videoDetails.getIsPremium());
            video.setPoemText(videoDetails.getPoemText());
            video.setSeoTitle(videoDetails.getSeoTitle());
            video.setSeoDescription(videoDetails.getSeoDescription());
            video.setTags(videoDetails.getTags());
            video.setHashtags(videoDetails.getHashtags());
            video.setSeoKeywords(videoDetails.getSeoKeywords());
            video.setIsVisible(videoDetails.getIsVisible());

            Video updatedVideo = videoService.saveVideo(video);
            return ResponseEntity.ok(updatedVideo);
        } else {
            logger.warn("Video not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found");
        }
    }

    /**
     * Update video visibility
     * PATCH /videos/{id}/visibility
     *
     * @param id the video ID
     * @param visible the visibility status
     * @return success status
     */
    @PatchMapping("/{id}/visibility")
    public ResponseEntity<?> updateVideoVisibility(
            @PathVariable Long id,
            @RequestParam boolean visible) {
        logger.info("Updating video visibility: id={}, visible={}", id, visible);

        Optional<Video> videoOpt = videoService.findVideoById(id);
        if (videoOpt.isPresent()) {
            videoService.updateVideoVisibility(id, visible);
            return ResponseEntity.ok().build();
        } else {
            logger.warn("Video not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found");
        }
    }

    /**
     * Update video conversion status
     * PATCH /videos/{id}/conversion-status
     *
     * @param id the video ID
     * @param status the conversion status
     * @return success status
     */
    @PatchMapping("/{id}/conversion-status")
    public ResponseEntity<?> updateConversionStatus(
            @PathVariable Long id,
            @RequestParam ConversionStatus status) {
        logger.info("Updating video conversion status: id={}, status={}", id, status);

        Optional<Video> videoOpt = videoService.findVideoById(id);
        if (videoOpt.isPresent()) {
            videoService.updateVideoConversionStatus(id, status);
            return ResponseEntity.ok().build();
        } else {
            logger.warn("Video not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found");
        }
    }

    /**
     * Delete a video
     * DELETE /videos/{id}
     *
     * @param id the video ID
     * @return success status
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVideo(@PathVariable Long id) {
        logger.info("Deleting video with id: {}", id);

        Optional<Video> videoOpt = videoService.findVideoById(id);
        if (videoOpt.isPresent()) {
            videoService.deleteVideo(id);
            return ResponseEntity.ok().build();
        } else {
            logger.warn("Video not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found");
        }
    }

    /**
     * Upload a new video with thumbnail and metadata
     * POST /api/videos/upload
     *
     * @param videoFile the video file
     * @param thumbnailFile the thumbnail image
     * @param videoData JSON string with video metadata
     * @param userId the authenticated user ID (from auth token)
     * @return the created video DTO
     */    @PostMapping("/upload")
    public ResponseEntity<?> uploadVideo(
            @RequestParam("videoFile") MultipartFile videoFile,
            @RequestParam("thumbnailFile") MultipartFile thumbnailFile,
            @RequestParam("videoData") String videoData,
            @RequestHeader(value = "X-User-ID", required = false) Long userId) {

        try {
            logger.info("Starting video upload process");
            
            // Log the user ID for debugging
            logger.info("Request from user ID: {}", userId);
            
            // Validate input data
            if (videoFile.isEmpty()) {
                return ResponseEntity.badRequest().body("Video file is required");
            }
            
            if (thumbnailFile.isEmpty()) {
                return ResponseEntity.badRequest().body("Thumbnail file is required");
            }
            
            // Store files
            FileUploadResponse videoResponse = fileStorageService.storeVideoFile(videoFile);
            FileUploadResponse thumbnailResponse = fileStorageService.storeThumbnailFile(thumbnailFile);            
            
            // Parse video data
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            objectMapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT);
            
            // Add proper debugging to see what's being received
            logger.info("Received video data: {}", videoData);
            
            // Declare videoDTO before try block to extend its scope
            VideoDTO videoDTO;
            try {
                videoDTO = objectMapper.readValue(videoData, VideoDTO.class);
                // Update URLs to use full paths
                videoDTO.setVideoUrl(videoResponse.getFilePath());
                videoDTO.setThumbnailUrl(thumbnailResponse.getFilePath());
                // Set the actual video duration
                videoDTO.setDuration(videoResponse.getDuration());
            } catch (IOException e) {
                logger.error("Error parsing JSON: {}", e.getMessage());
                return ResponseEntity.badRequest().body("Error parsing video data JSON: " + e.getMessage());
            }

            // Set necessary fields
            videoDTO.setIsVisible(true); // Ensure visibility is set
            videoDTO.setConversionStatus(ConversionStatus.COMPLETED); // Set status to completed

            // Create video
            VideoDTO createdVideo = videoService.createVideo(videoDTO);
            
            logger.info("Video uploaded successfully: {}", createdVideo.getId());
            return ResponseEntity.ok(createdVideo);
        } catch (Exception e) {
            logger.error("Error uploading video: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error uploading video: " + e.getMessage());
        }
    }

    /**
     * Track a video share
     * POST /api/videos/{id}/share
     * 
     * @param id the video ID
     * @return success status
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<Void> trackShare(@PathVariable Long id) {
        logger.info("Recording share for video with ID: {}", id);
        
        Optional<Video> videoOpt = videoService.findVideoById(id);
        if (!videoOpt.isPresent()) {
            logger.warn("Attempted to track share for non-existent video: {}", id);
            return ResponseEntity.notFound().build();
        }
        
        Video video = videoOpt.get();        // Increment share count if it exists, otherwise initialize it
        if (video.getShareCount() == null) {
            video.setShareCount(1L);
        } else {
            video.setShareCount(video.getShareCount() + 1L);
        }
        
        videoService.saveVideo(video);
        logger.info("Share tracked successfully for video: {}", id);
        
        return ResponseEntity.ok().build();
    }

    /**
     * Get related videos for a specific video
     * GET /videos/{id}/related
     *
     * @param id the video ID
     * @param limit maximum number of related videos to return
     * @return list of related videos
     */
    @GetMapping("/{id}/related")
    public ResponseEntity<?> getRelatedVideos(
            @PathVariable Long id,
            @RequestParam(defaultValue = "3") int limit) {
        logger.info("Fetching related videos for video id: {}, limit: {}", id, limit);
        
        Optional<Video> videoOpt = videoService.findVideoById(id);
        if (videoOpt.isEmpty()) {
            logger.warn("Video not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found");
        }
        
        Video video = videoOpt.get();
        List<Video> relatedVideos = videoService.findRelatedVideos(video, limit);
        
        return ResponseEntity.ok(relatedVideos);
    }

    /**
     * Update video duration
     * PATCH /api/videos/{id}/duration
     * 
     * @param id the video ID
     * @param durationData the new duration in seconds
     * @return success status
     */
    @PatchMapping("/{id}/duration")
    public ResponseEntity<?> updateVideoDuration(
            @PathVariable Long id,
            @RequestBody DurationUpdateRequest durationData) {
        logger.info("Updating video duration: id={}, duration={}, isFromMetadata={}", 
                id, durationData.getDuration(), durationData.getIsFromMetadata());

        Optional<Video> videoOpt = videoService.findVideoById(id);
        if (videoOpt.isPresent()) {
            Video video = videoOpt.get();
            
            // Log previous duration for debugging
            logger.info("Previous duration for video {}: {}", id, video.getDuration());
            
            // Update the duration
            video.setDuration(durationData.getDuration());
            
            // If this duration comes from metadata, mark it as verified in some way
            // You might want to add a new field to the Video entity for this purpose
            if (durationData.getIsFromMetadata() != null && durationData.getIsFromMetadata()) {
                logger.info("Duration for video {} verified from actual metadata", id);
                // If you had a field like "isDurationVerified", you would set it here
            }
            
            videoService.saveVideo(video);
            return ResponseEntity.ok().build();
        } else {
            logger.warn("Video not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found");
        }
    }

    /**
     * Simple DTO for duration update requests
     */
    static class DurationUpdateRequest {
        private Integer duration;
        private Boolean isFromMetadata;

        public Integer getDuration() {
            return duration;
        }

        public void setDuration(Integer duration) {
            this.duration = duration;
        }
        
        public Boolean getIsFromMetadata() {
            return isFromMetadata;
        }
        
        public void setIsFromMetadata(Boolean isFromMetadata) {
            this.isFromMetadata = isFromMetadata;
        }
    }
}
