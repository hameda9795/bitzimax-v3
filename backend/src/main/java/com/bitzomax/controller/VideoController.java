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

import java.util.List;
import java.util.Optional;

/**
 * REST controller for handling video-related endpoints
 */
@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private static final Logger logger = LoggerFactory.getLogger(VideoController.class);

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
     * @return the created video DTO
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadVideo(
            @RequestParam("videoFile") MultipartFile videoFile,
            @RequestParam("thumbnailFile") MultipartFile thumbnailFile,
            @RequestParam("videoData") String videoData) {

        try {
            FileUploadResponse videoResponse = fileStorageService.storeVideoFile(videoFile);
            FileUploadResponse thumbnailResponse = fileStorageService.storeThumbnailFile(thumbnailFile);

            ObjectMapper objectMapper = new ObjectMapper();            VideoDTO videoDTO = objectMapper.readValue(videoData, VideoDTO.class);

            videoDTO.setVideoUrl(videoResponse.getFilePath());
            videoDTO.setThumbnailUrl(thumbnailResponse.getFilePath());
            videoDTO.setIsVisible(true); // Ensure visibility is set
            videoDTO.setConversionStatus(ConversionStatus.COMPLETED); // Set status to completed

            VideoDTO createdVideo = videoService.createVideo(videoDTO);

            return ResponseEntity.ok(createdVideo);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error uploading video: " + e.getMessage());
        }
    }
}
