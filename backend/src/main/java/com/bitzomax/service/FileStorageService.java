package com.bitzomax.service;

import com.bitzomax.config.FileStorageProperties;
import com.bitzomax.dto.FileUploadResponse;
import com.bitzomax.exception.FileStorageException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
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
                // Convert duration string to seconds (rounded to nearest integer)
                return (int) Math.round(Double.parseDouble(durationStr));
            }
        } catch (Exception e) {
            logger.error("Error extracting video duration: {}", e.getMessage());
            throw new IOException("Failed to extract video duration", e);
        }
        
        return 0; // Return 0 if duration couldn't be extracted
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
