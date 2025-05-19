package com.bitzomax.controller;

import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import com.bitzomax.service.VideoFixService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin controller for system maintenance and troubleshooting
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    
    @Autowired
    private VideoRepository videoRepository;
    
    @Autowired
    private VideoFixService videoFixService;
      /**
     * Debug endpoint to check video visibility status
     */    @GetMapping("/videos/check")
    public ResponseEntity<?> checkVideoVisibility() {
        logger.info("Checking video visibility status");
        
        List<Video> allVideos = videoRepository.findAll();
        
        List<Map<String, Object>> videosList = new ArrayList<>();
        for (Video v : allVideos) {
            Map<String, Object> videoMap = new HashMap<>();
            videoMap.put("id", v.getId());
            videoMap.put("title", v.getTitle());
            videoMap.put("status", v.getConversionStatus());
            videoMap.put("isVisible", v.getIsVisible());
            videosList.add(videoMap);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("totalCount", allVideos.size());
        result.put("visibleCount", allVideos.stream().filter(v -> v.getIsVisible() != null && v.getIsVisible()).count());
        result.put("invisibleCount", allVideos.stream().filter(v -> v.getIsVisible() != null && !v.getIsVisible()).count());
        result.put("nullVisibilityCount", allVideos.stream().filter(v -> v.getIsVisible() == null).count());
        result.put("videos", videosList);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Fix videos that should be visible (completed) but aren't
     */
    @PostMapping("/videos/fix-visibility")
    public ResponseEntity<?> fixVideoVisibility() {
        logger.info("Fixing video visibility issues");
        
        int fixedCount = videoFixService.fixVideoVisibility();
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Fixed visibility for " + fixedCount + " videos",
            "fixedCount", fixedCount
        ));
    }
    
    /**
     * Force all videos to be visible
     */    @PostMapping("/videos/force-visible")
    public ResponseEntity<?> forceAllVideosVisible() {
        logger.info("Forcing all videos to be visible");
        
        int fixedCount = videoFixService.forceAllVideosVisible();
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Made " + fixedCount + " videos visible",
            "fixedCount", fixedCount
        ));
    }    /**
     * Delete a video by ID (legacy method, use AdminVideoController instead)
     * DELETE /admin/v1/videos/{id}
     *
     * @param id the video ID to delete
     * @return success status
     * @deprecated Use AdminVideoController.deleteVideo instead
     */
    @Deprecated
    @DeleteMapping("/v1/videos/{id}")
    public ResponseEntity<?> deleteVideoLegacy(@PathVariable Long id) {
        logger.info("Deleting video with id (legacy): {}", id);
        
        try {
            videoFixService.getVideoService().deleteVideo(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting video with id: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting video: " + e.getMessage());
        }
    }
}