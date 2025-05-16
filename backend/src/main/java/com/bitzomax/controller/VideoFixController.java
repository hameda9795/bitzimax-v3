package com.bitzomax.controller;

import com.bitzomax.service.VideoFixService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for fixing video visibility issues
 * This is a utility controller that can be accessed without admin privileges
 */
@RestController
@RequestMapping("/api/fix")
public class VideoFixController {

    private static final Logger logger = LoggerFactory.getLogger(VideoFixController.class);
    
    @Autowired
    private VideoFixService videoFixService;
    
    /**
     * Fix video visibility issues
     */
    @GetMapping("/videos")
    public ResponseEntity<Map<String, Object>> fixVideos() {
        logger.info("Fixing video visibility through public endpoint");
        
        try {
            int fixedCount = videoFixService.forceAllVideosVisible();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Fixed " + fixedCount + " videos");
            response.put("fixedCount", fixedCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fixing videos", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}