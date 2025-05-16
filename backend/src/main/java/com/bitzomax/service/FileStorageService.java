package com.bitzomax.service;

import com.bitzomax.config.FileStorageProperties;
import com.bitzomax.dto.FileUploadResponse;
import com.bitzomax.exception.FileStorageException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
     */    public FileUploadResponse storeVideoFile(MultipartFile file) {
        FileUploadResponse fileResponse = storeFile(file, videoStorageLocation);
        String fileName = fileResponse.getFileName();
        
        // Use API URL path format instead of filesystem path
        String apiPath = "/api/files/videos/" + fileName;
        
        // Update conversion status in a separate thread
        CompletableFuture.runAsync(() -> {
            try {
                // Simulate processing delay
                Thread.sleep(3000);
                
                // After processing is complete, update the video status
                // This would typically be done by a video processing service
                // For now, we'll just log it
                logger.info("Video processing completed for: {}", fileName);
                
                // In a real implementation, you would find the video entity and update it:
                // videoService.updateVideoConversionStatus(videoId, ConversionStatus.COMPLETED);
                // videoService.updateVideoVisibility(videoId, true);
            } catch (InterruptedException e) {
                logger.error("Video processing interrupted", e);
            }
        });
        
        return new FileUploadResponse(fileName, file.getContentType(), apiPath, file.getSize());
    }

    /**
     * Stores a thumbnail file and returns response with file details
     * 
     * @param file The MultipartFile to store
     * @return FileUploadResponse with details of the stored file
     */    public FileUploadResponse storeThumbnailFile(MultipartFile file) {
        FileUploadResponse response = storeFile(file, thumbnailStorageLocation);
        // Update the file path to use the API URL instead of filesystem path
        String apiPath = "/api/files/thumbnails/" + response.getFileName();
        return new FileUploadResponse(
            response.getFileName(),
            response.getFileType(),
            apiPath,
            response.getSize()
        );
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
            
            String storedPath = targetLocation.toString();
            
            // Create and return response
            return new FileUploadResponse(
                uniqueFilename, 
                file.getContentType(), 
                storedPath,
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
