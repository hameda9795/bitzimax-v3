package com.bitzomax.service;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class VideoUploadService {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoUploadService.class);
    
    @Autowired
    private VideoService videoService;
    
    // Define upload directory
    private final String uploadDir = "uploads/videos";
    
    /**
     * Process a video upload asynchronously
     */
    @Async
    public CompletableFuture<Video> processVideoUpload(MultipartFile file, Video videoMetadata) {
        try {
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(uniqueFilename);
            
            // Save file
            Files.copy(file.getInputStream(), filePath);
            
            // Set video metadata
            videoMetadata.setVideoUrl("/uploads/videos/" + uniqueFilename);
            videoMetadata.setOriginalFormat(fileExtension);
            videoMetadata.setUploadDate(LocalDateTime.now());
            videoMetadata.setConversionStatus(ConversionStatus.PROCESSING);
            videoMetadata.setIsVisible(true); // Set video to visible immediately
            
            // Save video entry
            Video savedVideo = videoService.saveVideo(videoMetadata);
            
            // Simulate video processing
            simulateVideoProcessing(savedVideo);
            
            return CompletableFuture.completedFuture(savedVideo);
        } catch (IOException e) {
            logger.error("Failed to process video upload", e);
            throw new RuntimeException("Failed to process video upload", e);
        }
    }
    
    /**
     * Simulate video processing (for demonstration purposes)
     */
    @Async
    public void simulateVideoProcessing(Video video) {
        try {
            // Simulate processing time
            Thread.sleep(3000);
            
            // Update video status
            video.setConversionStatus(ConversionStatus.COMPLETED);
            video.setIsVisible(true); // Set video to visible after processing
            videoService.saveVideo(video);
            
            logger.info("Video processing completed for: {}", video.getTitle());
        } catch (InterruptedException e) {
            logger.error("Video processing interrupted", e);
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null) {
            return ".mp4";
        }
        
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex < 0) {
            return ".mp4";
        }
        
        return filename.substring(lastDotIndex);
    }
}