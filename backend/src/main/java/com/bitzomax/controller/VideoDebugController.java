package com.bitzomax.controller;

import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/debug")
public class VideoDebugController {

    private static final Logger logger = LoggerFactory.getLogger(VideoDebugController.class);
    
    @Autowired
    private VideoRepository videoRepository;
    
    @GetMapping("/videos")
    public ResponseEntity<?> debugVideos() {
        try {
            List<Video> videos = videoRepository.findAll();
            logger.info("Debug - Found {} videos in database", videos.size());
            
            // Log details of each video for debugging
            videos.forEach(video -> {                logger.info("Video ID: {}, Title: {}, URL: {}, Status: {}",
                    video.getId(),
                    video.getTitle(),
                    video.getVideoUrl(),
                    video.getConversionStatus()
                );
            });
            
            return ResponseEntity.ok().body(videos);
        } catch (Exception e) {
            logger.error("Error in debug videos endpoint", e);
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}