package com.bitzomax.config;

import com.bitzomax.service.VideoFixService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Listener that executes tasks when the application starts
 */
@Component
public class ApplicationStartupListener {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationStartupListener.class);
    
    private final VideoFixService videoFixService;
    
    @Autowired
    public ApplicationStartupListener(VideoFixService videoFixService) {
        this.videoFixService = videoFixService;
    }
    
    /**
     * Runs when the Spring application context is initialized
     */
    @EventListener
    public void onApplicationEvent(ContextRefreshedEvent event) {
        logger.info("Application started, fixing video visibility issues...");
        
        try {
            int fixedCount = videoFixService.fixVideoVisibility();
            logger.info("Fixed visibility for {} videos during startup", fixedCount);
        } catch (Exception e) {
            logger.error("Error fixing video visibility on startup", e);
        }
    }
}