package com.bitzomax.controller;

import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import com.bitzomax.service.VideoFixService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
     */
    @GetMapping("/videos/check")
    public ResponseEntity<?> checkVideoVisibility() {
        logger.info("Checking video visibility status");
        
        List<Video> allVideos = videoRepository.findAll();
        
        Map<String, Object> result = Map.of(
            "totalCount", allVideos.size(),
            "visibleCount", allVideos.stream().filter(v -> v.getIsVisible() != null && v.getIsVisible()).count(),
            "hiddenCount", allVideos.stream().filter(v -> v.getIsVisible() == null || !v.getIsVisible()).count(),
            "nullVisibilityCount", allVideos.stream().filter(v -> v.getIsVisible() == null).count(),
            "videos", allVideos.stream().map(v -> Map.of(
                "id", v.getId(),
                "title", v.getTitle(),
                "status", v.getConversionStatus(),
                "isVisible", v.getIsVisible()
            )).collect(Collectors.toList())
        );
        
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
     */
    @PostMapping("/videos/force-visible")
    public ResponseEntity<?> forceAllVideosVisible() {
        logger.info("Forcing all videos to be visible");
        
        int fixedCount = videoFixService.forceAllVideosVisible();
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Made " + fixedCount + " videos visible",
            "fixedCount", fixedCount
        ));
    }
}