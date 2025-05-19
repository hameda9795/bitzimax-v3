package com.bitzomax.service;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import com.bitzomax.repository.VideoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service to fix video visibility issues
 */
@Service
public class VideoFixService {

    private static final Logger logger = LoggerFactory.getLogger(VideoFixService.class);
      @Autowired
    private VideoRepository videoRepository;
    
    @Autowired
    private VideoService videoService;
    
    /**
     * Get the video service
     * @return the video service
     */
    public VideoService getVideoService() {
        return videoService;
    }    /**
     * Fix visibility for all videos that are completed but not visible
     * This also corrects null visibility values on any videos
     */
    @Transactional
    public int fixVideoVisibility() {
        int count = 0;
        List<Video> allVideos = videoRepository.findAll();
        
        for (Video video : allVideos) {
            boolean shouldFix = false;
            
            // If video is completed but not visible, make it visible
            if (ConversionStatus.COMPLETED.equals(video.getConversionStatus()) 
                    && (video.getIsVisible() == null || !video.getIsVisible())) {
                video.setIsVisible(true);
                shouldFix = true;
                logger.info("Fixed visibility for video: {} (ID: {})", video.getTitle(), video.getId());
            }
            // In this special case for testing purposes, we make FAILED videos visible too
            // In a real production scenario, this might be different
            else if (ConversionStatus.FAILED.equals(video.getConversionStatus())
                    && (video.getIsVisible() == null || !video.getIsVisible())) {
                video.setIsVisible(true);
                shouldFix = true;
                logger.info("Fixed visibility for failed video: {} (ID: {})", video.getTitle(), video.getId());
            }
            // If video has null visibility status
            else if (video.getIsVisible() == null) {
                // For all statuses, set visibility to true by default for testing
                video.setIsVisible(true);
                shouldFix = true;
                logger.info("Set default visibility for video: {} (ID: {})", video.getTitle(), video.getId());
            }
            
            if (shouldFix) {
                videoRepository.save(video);
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * Force visibility for all videos regardless of status
     */
    @Transactional
    public int forceAllVideosVisible() {
        int count = 0;
        List<Video> allVideos = videoRepository.findAll();
        
        for (Video video : allVideos) {
            if (video.getIsVisible() == null || !video.getIsVisible()) {
                video.setIsVisible(true);
                videoRepository.save(video);
                count++;
                logger.info("Forced visibility for video: {} (ID: {})", video.getTitle(), video.getId());
            }
        }
        
        return count;
    }
}