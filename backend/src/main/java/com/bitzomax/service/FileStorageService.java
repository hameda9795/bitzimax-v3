package com.bitzomax.service;

import com.bitzomax.config.FileStorageProperties;
import com.bitzomax.dto.FileUploadResponse;
import com.bitzomax.exception.FileStorageException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class FileStorageService {

    private final Path videoStorageLocation;
    private final Path thumbnailStorageLocation;
    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    @Autowired
    public FileStorageService(FileStorageProperties fileStorageProperties) {
        this.videoStorageLocation = Paths.get(fileStorageProperties.getVideoUploadDir())
                .toAbsolutePath().normalize();
        this.thumbnailStorageLocation = Paths.get(fileStorageProperties.getThumbnailUploadDir())
                .toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.videoStorageLocation);
            Files.createDirectories(this.thumbnailStorageLocation);
        } catch (Exception ex) {
            throw new FileStorageException("Could not create the directories where the uploaded files will be stored.", ex);
        }
    }

    /**
     * Store a video file and update its conversion status
     */
    public FileUploadResponse storeVideoFile(MultipartFile file) {
        // Get the response from storeFile, which now contains the correct web path
        FileUploadResponse response = storeFile(file, videoStorageLocation);
        
        // Extract video duration
        try {
            int duration = extractVideoDuration(response.getFilePath());
            response.setDuration(duration);
        } catch (Exception e) {
            logger.error("Error extracting video duration", e);
            // Set a default duration if extraction fails
            response.setDuration(0);
        }
        
        // Keep the async processing logic
        CompletableFuture.runAsync(() -> {
            try {
                Thread.sleep(3000); // Simulate processing
                logger.info("Video processing completed for: {}", response.getFileName());
            } catch (InterruptedException e) {
                logger.error("Video processing interrupted", e);
                Thread.currentThread().interrupt(); // Restore interruption status
            }
        });
        
        // Return the response with the web path and duration
        return response;
    }

    /**
     * Extract video duration using FFmpeg
     * @param filePath Path to the video file
     * @return Duration in seconds
     */
    private int extractVideoDuration(String filePath) throws IOException {
        // First try with FFprobe
        try {
            String[] cmd = {
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                filePath
            };
            
            Process process = Runtime.getRuntime().exec(cmd);
            
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String durationStr = reader.readLine();
                if (durationStr != null && !durationStr.isEmpty()) {
                    try {
                        // Convert duration string to seconds (rounded to nearest integer)
                        double durationDouble = Double.parseDouble(durationStr);
                        logger.info("Successfully extracted duration with FFprobe: {} seconds", durationDouble);
                        return (int) Math.round(durationDouble);
                    } catch (NumberFormatException e) {
                        logger.warn("Failed to parse duration string: {}", durationStr);
                        // Continue to fallback method
                    }
                }
            } catch (Exception e) {
                logger.warn("Error extracting video duration with FFprobe: {}", e.getMessage());
                // Continue to fallback method
            }
        } catch (Exception e) {
            logger.warn("FFprobe execution failed, falling back to default duration: {}", e.getMessage());
            // Continue to fallback method
        }
        
        // If FFprobe fails, try to estimate duration based on file size and bitrate
        try {
            File file = new File(filePath);
            long fileSize = file.length(); // in bytes
            
            // Use a more conservative bitrate estimate to prevent underestimating durations
            // 500 kbps is reasonable for most web videos
            long assumedBitrate = 500 * 1024; // 500 kbps converted to bits per second
            
            // Calculate duration: fileSize (in bits) / bitrate (bits per second) = duration (seconds)
            // 8 bits per byte
            int estimatedDuration = (int)((fileSize * 8) / assumedBitrate);
            
            logger.info("Estimated duration from file size: {} seconds for {} bytes", estimatedDuration, fileSize);
            
            // Always return at least 1 second for any valid video file
            return Math.max(estimatedDuration, 1);
        } catch (Exception e) {
            logger.error("Error estimating video duration from file size: {}", e.getMessage());
        }
        
        // If all else fails, return a reasonable default
        logger.warn("Falling back to default duration for file: {}", filePath);
        return 60; // Use a value that will make it clear it's a fallback (1 minute)
    }

    /**
     * Stores a thumbnail file and returns response with file details
     * 
     * @param file The MultipartFile to store
     * @return FileUploadResponse with details of the stored file
     */
    public FileUploadResponse storeThumbnailFile(MultipartFile file) {
        return storeFile(file, thumbnailStorageLocation);
    }

    /**
     * Gets the path to a stored video file
     * 
     * @param filename The name of the file
     * @return String representing the path to the file
     */
    public String getVideoFilePath(String filename) {
        return videoStorageLocation.resolve(filename).toString();
    }

    /**
     * Gets the path to a stored thumbnail file
     * 
     * @param filename The name of the file
     * @return String representing the path to the file
     */
    public String getThumbnailFilePath(String filename) {
        return thumbnailStorageLocation.resolve(filename).toString();
    }

    /**
     * Private helper method to store files
     */
    private FileUploadResponse storeFile(MultipartFile file, Path storageLocation) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot store empty file");
        }
        
        // Generate a unique filename to prevent overwriting existing files
        String originalFilename = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        // Check if the filename contains invalid characters
        if (originalFilename.contains("..")) {
            throw new FileStorageException("Filename contains invalid path sequence " + originalFilename);
        }
        
        // Copy file to the target location (replacing existing file with the same name)
        try {
            Path targetLocation = storageLocation.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Determine the base 'uploads' directory segment for constructing the web path
            // storageLocation is like /abs/path/to/uploads/videos or /abs/path/to/uploads/thumbnails
            String type = storageLocation.getFileName().toString(); // "videos" or "thumbnails"
            String webPath = "/uploads/" + type + "/" + uniqueFilename;
            
            // Create and return response
            return new FileUploadResponse(
                uniqueFilename, 
                file.getContentType(), 
                webPath, // Use the web-accessible relative path
                file.getSize()
            );
        } catch (IOException ex) {
            throw new FileStorageException("Could not store file " + originalFilename, ex);
        }
    }
    
    /**
     * Helper method to extract file extension
     */
    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? "" : filename.substring(dotIndex);
    }
}
