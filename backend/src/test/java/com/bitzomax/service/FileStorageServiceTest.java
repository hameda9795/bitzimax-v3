package com.bitzomax.service;

import com.bitzomax.config.FileStorageProperties;
import com.bitzomax.dto.FileUploadResponse;
import com.bitzomax.exception.FileStorageException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

public class FileStorageServiceTest {

    private FileStorageService fileStorageService;

    @Mock
    private FileStorageProperties fileStorageProperties;

    @TempDir
    Path tempDir;

    private Path videoDir;
    private Path thumbnailDir;

    @BeforeEach
    void setUp() throws IOException {
        MockitoAnnotations.openMocks(this);
        
        // Create temp directories for videos and thumbnails
        videoDir = tempDir.resolve("videos");
        thumbnailDir = tempDir.resolve("thumbnails");
        Files.createDirectories(videoDir);
        Files.createDirectories(thumbnailDir);
        
        // Configure mock properties
        when(fileStorageProperties.getVideoUploadDir()).thenReturn(videoDir.toString());
        when(fileStorageProperties.getThumbnailUploadDir()).thenReturn(thumbnailDir.toString());
        
        // Initialize service with mock properties
        fileStorageService = new FileStorageService(fileStorageProperties);
    }

    @Test
    @DisplayName("Should store video file successfully")
    void storeVideoFile() {
        // Given
        byte[] content = "test video content".getBytes();
        MockMultipartFile multipartFile = new MockMultipartFile(
                "file", "test-video.mp4", "video/mp4", content);

        // When
        FileUploadResponse response = fileStorageService.storeVideoFile(multipartFile);

        // Then
        assertNotNull(response);
        assertNotNull(response.getFileName());
        assertTrue(response.getFileName().endsWith(".mp4"));
        assertEquals("video/mp4", response.getFileType());
        assertTrue(response.getFilePath().startsWith("/uploads/videos/"));
        assertEquals(content.length, response.getSize());
        
        // Verify file was actually stored
        Path storedFilePath = videoDir.resolve(response.getFileName());
        assertTrue(Files.exists(storedFilePath));
    }

    @Test
    @DisplayName("Should store thumbnail file successfully")
    void storeThumbnailFile() {
        // Given
        byte[] content = "test thumbnail content".getBytes();
        MockMultipartFile multipartFile = new MockMultipartFile(
                "file", "test-thumbnail.jpg", "image/jpeg", content);

        // When
        FileUploadResponse response = fileStorageService.storeThumbnailFile(multipartFile);

        // Then
        assertNotNull(response);
        assertNotNull(response.getFileName());
        assertTrue(response.getFileName().endsWith(".jpg"));
        assertEquals("image/jpeg", response.getFileType());
        assertTrue(response.getFilePath().startsWith("/uploads/thumbnails/"));
        assertEquals(content.length, response.getSize());
        
        // Verify file was actually stored
        Path storedFilePath = thumbnailDir.resolve(response.getFileName());
        assertTrue(Files.exists(storedFilePath));
    }

    @Test
    @DisplayName("Should throw exception when storing empty file")
    void storeEmptyFile() {
        // Given
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.mp4", "video/mp4", new byte[0]);

        // Then
        assertThrows(FileStorageException.class, () -> {
            // When
            fileStorageService.storeVideoFile(emptyFile);
        });
    }

    @Test
    @DisplayName("Should throw exception for invalid filenames")
    void storeFileWithInvalidName() {
        // Given
        MockMultipartFile fileWithInvalidPath = new MockMultipartFile(
                "file", "../test/../../invalid.mp4", "video/mp4", "content".getBytes());

        // Then
        assertThrows(FileStorageException.class, () -> {
            // When
            fileStorageService.storeVideoFile(fileWithInvalidPath);
        });
    }

    @Test
    @DisplayName("Should get correct video file path")
    void getVideoFilePath() {
        // Given
        String filename = "test.mp4";
        
        // When
        String path = fileStorageService.getVideoFilePath(filename);
        
        // Then
        assertEquals(videoDir.resolve(filename).toString(), path);
    }

    @Test
    @DisplayName("Should get correct thumbnail file path")
    void getThumbnailFilePath() {
        // Given
        String filename = "test.jpg";
        
        // When
        String path = fileStorageService.getThumbnailFilePath(filename);
        
        // Then
        assertEquals(thumbnailDir.resolve(filename).toString(), path);
    }
}
