package com.bitzomax.controller;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Special controller for fixing video issues
 */
@RestController
@RequestMapping("/api/fix-videos")
public class VideoFixerController {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoFixerController.class);
    
    @Autowired
    private VideoRepository videoRepository;
    
    /**
     * Get status of all videos in the system
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getVideoStatus() {
        Map<String, Object> response = new HashMap<>();
        List<Video> allVideos = videoRepository.findAll();
        
        response.put("totalVideos", allVideos.size());
        response.put("visibleVideos", allVideos.stream().filter(v -> Boolean.TRUE.equals(v.getIsVisible())).count());
        response.put("invisibleVideos", allVideos.stream().filter(v -> !Boolean.TRUE.equals(v.getIsVisible())).count());
        response.put("completedVideos", allVideos.stream().filter(v -> ConversionStatus.COMPLETED.equals(v.getConversionStatus())).count());
        response.put("pendingVideos", allVideos.stream().filter(v -> ConversionStatus.PENDING.equals(v.getConversionStatus())).count());
        response.put("failedVideos", allVideos.stream().filter(v -> ConversionStatus.FAILED.equals(v.getConversionStatus())).count());
        response.put("nullDateVideos", allVideos.stream().filter(v -> v.getUploadDate() == null).count());
        
        // Get video details with issues
        List<Map<String, Object>> videoDetails = allVideos.stream()
                .map(v -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", v.getId());
                    details.put("title", v.getTitle());
                    details.put("visible", v.getIsVisible());
                    details.put("status", v.getConversionStatus());
                    details.put("uploadDate", v.getUploadDate());
                    details.put("videoUrl", v.getVideoUrl());
                    details.put("thumbnailUrl", v.getThumbnailUrl());
                    return details;
                })
                .collect(Collectors.toList());
        
        response.put("videos", videoDetails);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Fix all videos by ensuring they're set to visible and have an upload date
     */
    @PostMapping("/fix-all")
    public ResponseEntity<Map<String, Object>> fixAllVideos() {
        int fixedCount = 0;
        List<Video> allVideos = videoRepository.findAll();
        
        for (Video video : allVideos) {
            boolean modified = false;
            
            // Fix visibility
            if (video.getIsVisible() == null || !video.getIsVisible()) {
                video.setIsVisible(true);
                modified = true;
            }
            
            // Fix upload date
            if (video.getUploadDate() == null) {
                video.setUploadDate(LocalDateTime.now());
                modified = true;
            }
            
            // Fix conversion status
            if (video.getConversionStatus() == null) {
                video.setConversionStatus(ConversionStatus.COMPLETED);
                modified = true;
            }
            
            // Fix thumbnail URL if it uses file:// protocol or is a file path
            if (video.getThumbnailUrl() != null) {
                String thumbnailUrl = video.getThumbnailUrl();
                if (thumbnailUrl.startsWith("file://") || thumbnailUrl.startsWith("C:") || 
                        thumbnailUrl.startsWith("/") || thumbnailUrl.contains(":\\")) {
                    // Extract filename from path
                    String filename = thumbnailUrl.substring(thumbnailUrl.lastIndexOf("/") + 1);
                    if (filename.contains("\\")) {
                        filename = filename.substring(filename.lastIndexOf("\\") + 1);
                    }
                    video.setThumbnailUrl("/api/files/thumbnails/" + filename);
                    modified = true;
                }
            }
            
            // Fix video URL if it uses file:// protocol or is a file path
            if (video.getVideoUrl() != null) {
                String videoUrl = video.getVideoUrl();
                if (videoUrl.startsWith("file://") || videoUrl.startsWith("C:") || 
                        videoUrl.startsWith("/") || videoUrl.contains(":\\")) {
                    // Extract filename from path
                    String filename = videoUrl.substring(videoUrl.lastIndexOf("/") + 1);
                    if (filename.contains("\\")) {
                        filename = filename.substring(filename.lastIndexOf("\\") + 1);
                    }
                    video.setVideoUrl("/api/files/videos/" + filename);
                    modified = true;
                }
            }
            
            // Save if modified
            if (modified) {
                videoRepository.save(video);
                fixedCount++;
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("fixedCount", fixedCount);
        response.put("totalVideos", allVideos.size());
        response.put("message", "Fixed " + fixedCount + " videos out of " + allVideos.size());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Fix thumbnail paths to use API URLs instead of file paths
     */
    @PostMapping("/fix-thumbnails")
    public ResponseEntity<Map<String, Object>> fixThumbnailPaths() {
        int fixedCount = 0;
        List<Video> allVideos = videoRepository.findAll();
        
        for (Video video : allVideos) {
            boolean modified = false;
            
            // Fix thumbnail URL if it uses file:// protocol or is a file path
            if (video.getThumbnailUrl() != null) {
                String thumbnailUrl = video.getThumbnailUrl();
                if (thumbnailUrl.startsWith("file://") || thumbnailUrl.startsWith("C:") || 
                        thumbnailUrl.startsWith("/") || thumbnailUrl.contains(":\\")) {
                    // Extract filename from path
                    String filename = thumbnailUrl.substring(thumbnailUrl.lastIndexOf("/") + 1);
                    if (filename.contains("\\")) {
                        filename = filename.substring(filename.lastIndexOf("\\") + 1);
                    }
                    video.setThumbnailUrl("/api/files/thumbnails/" + filename);
                    modified = true;
                }
            }
            
            // Save if modified
            if (modified) {
                videoRepository.save(video);
                fixedCount++;
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("fixedCount", fixedCount);
        response.put("totalVideos", allVideos.size());
        response.put("message", "Fixed " + fixedCount + " thumbnail paths out of " + allVideos.size() + " videos");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Fix invalid dates by setting current timestamp
     */
    @PostMapping("/fix-dates")
    public ResponseEntity<Map<String, Object>> fixDates() {
        int fixedCount = 0;
        List<Video> allVideos = videoRepository.findAll();
        
        for (Video video : allVideos) {
            if (video.getUploadDate() == null) {
                video.setUploadDate(LocalDateTime.now());
                videoRepository.save(video);
                fixedCount++;
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("fixedCount", fixedCount);
        response.put("totalVideos", allVideos.size());
        response.put("message", "Fixed " + fixedCount + " videos with null dates");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Remove sample videos by ID
     */
    @DeleteMapping("/samples")
    public ResponseEntity<?> removeSampleVideos(@RequestParam(required = false) List<Long> ids) {
        logger.info("Starting sample video cleanup");
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Video> videos;
            if (ids != null && !ids.isEmpty()) {
                // Delete specific videos
                videos = videoRepository.findAllById(ids);
            } else {
                // If no IDs provided, find videos that have keywords in their title or description
                // indicating they are samples
                videos = videoRepository.findAll().stream()
                         .filter(v -> (v.getTitle() != null && 
                                     (v.getTitle().toLowerCase().contains("sample") || 
                                      v.getTitle().toLowerCase().contains("test") ||
                                      v.getTitle().toLowerCase().contains("demo"))) ||
                                     (v.getDescription() != null &&
                                     (v.getDescription().toLowerCase().contains("sample") ||
                                      v.getDescription().toLowerCase().contains("test") ||
                                      v.getDescription().toLowerCase().contains("demo"))))
                         .collect(Collectors.toList());
            }
            
            if (videos.isEmpty()) {
                response.put("message", "No sample videos found to delete");
                return ResponseEntity.ok(response);
            }
            
            // Save video file paths before deletion
            List<String> videoUrls = new ArrayList<>();
            List<String> thumbnailUrls = new ArrayList<>();
            List<String> titles = new ArrayList<>();
            
            for (Video video : videos) {
                videoUrls.add(video.getVideoUrl());
                thumbnailUrls.add(video.getThumbnailUrl());
                titles.add(video.getTitle());
            }
            
            // Delete from database first
            for (Video video : videos) {
                videoRepository.delete(video);
            }
            
            // Try to delete files (non-critical operation)
            for (String videoUrl : videoUrls) {
                if (videoUrl != null && !videoUrl.isEmpty()) {
                    try {
                        Path path = Paths.get("uploads/videos/" + videoUrl.substring(videoUrl.lastIndexOf('/') + 1));
                        Files.deleteIfExists(path);
                    } catch (Exception e) {
                        logger.warn("Could not delete video file: {}", videoUrl, e);
                    }
                }
            }
            
            for (String thumbnailUrl : thumbnailUrls) {
                if (thumbnailUrl != null && !thumbnailUrl.isEmpty()) {
                    try {
                        Path path = Paths.get("uploads/thumbnails/" + thumbnailUrl.substring(thumbnailUrl.lastIndexOf('/') + 1));
                        Files.deleteIfExists(path);
                    } catch (Exception e) {
                        logger.warn("Could not delete thumbnail file: {}", thumbnailUrl, e);
                    }
                }
            }
            
            // Prepare success response
            response.put("success", true);
            response.put("message", String.format("Deleted %d sample videos", videos.size()));
            response.put("deletedVideos", titles);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error removing sample videos", e);
            
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}