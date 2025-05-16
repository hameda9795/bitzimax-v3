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
    
    /**
     * Fix visibility for all videos that are completed but not visible
     */
    @Transactional
    public int fixVideoVisibility() {
        int count = 0;
        List<Video> allVideos = videoRepository.findAll();
        
        for (Video video : allVideos) {
            // If video is completed but not visible, make it visible
            if (ConversionStatus.COMPLETED.equals(video.getConversionStatus()) 
                    && (video.getIsVisible() == null || !video.getIsVisible())) {
                video.setIsVisible(true);
                videoRepository.save(video);
                count++;
                logger.info("Fixed visibility for video: {} (ID: {})", video.getTitle(), video.getId());
            }
            // If video doesn't have a visibility status, set it to visible by default
            else if (video.getIsVisible() == null) {
                video.setIsVisible(true);
                videoRepository.save(video);
                count++;
                logger.info("Set default visibility for video: {} (ID: {})", video.getTitle(), video.getId());
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