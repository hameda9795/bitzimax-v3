package com.bitzomax.controller;

import com.bitzomax.dto.FileUploadResponse;
import com.bitzomax.dto.VideoDTO;
import com.bitzomax.exception.FileStorageException;
import com.bitzomax.model.ConversionStatus;
import com.bitzomax.service.FileStorageService;
import com.bitzomax.service.VideoService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * REST controller for admin video management operations
 */
@RestController
@RequestMapping("/admin/videos")
public class AdminVideoController {
    
    private final VideoService videoService;
    private final FileStorageService fileStorageService;
    
    @Autowired
    public AdminVideoController(VideoService videoService, FileStorageService fileStorageService) {
        this.videoService = videoService;
        this.fileStorageService = fileStorageService;
    }
    
    /**
     * Upload a new video with multipart form data
     * POST /admin/videos
     * 
     * @param videoFile the video file
     * @param thumbnailFile the thumbnail image
     * @param title the video title
     * @param description the video description
     * @param isPremium whether the video is premium content
     * @param poemText associated poem text (optional)
     * @param seoTitle SEO title (optional)
     * @param seoDescription SEO description (optional)
     * @param tagsStr comma-separated tags (optional)
     * @param hashtagsStr comma-separated hashtags (optional)
     * @param seoKeywordsStr comma-separated SEO keywords (optional)
     * @return the created video DTO
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoDTO> uploadVideo(
            @RequestParam("videoFile") MultipartFile videoFile,
            @RequestParam("thumbnailFile") MultipartFile thumbnailFile,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam(value = "isPremium", defaultValue = "false") Boolean isPremium,
            @RequestParam(value = "poemText", required = false) String poemText,
            @RequestParam(value = "seoTitle", required = false) String seoTitle,
            @RequestParam(value = "seoDescription", required = false) String seoDescription,
            @RequestParam(value = "tags", required = false) String tagsStr,
            @RequestParam(value = "hashtags", required = false) String hashtagsStr,
            @RequestParam(value = "seoKeywords", required = false) String seoKeywordsStr) {
        
        try {
            // Store video and thumbnail files
            FileUploadResponse videoResponse = fileStorageService.storeVideoFile(videoFile);
            FileUploadResponse thumbnailResponse = fileStorageService.storeThumbnailFile(thumbnailFile);
            
            // Create VideoDTO object
            VideoDTO videoDTO = new VideoDTO();
            videoDTO.setTitle(title);
            videoDTO.setDescription(description);
            videoDTO.setVideoUrl(videoResponse.getFilePath());
            videoDTO.setThumbnailUrl(thumbnailResponse.getFilePath());
            videoDTO.setIsPremium(isPremium);
            videoDTO.setPoemText(poemText);
            videoDTO.setSeoTitle(seoTitle);
            videoDTO.setSeoDescription(seoDescription);            videoDTO.setOriginalFormat(videoFile.getContentType());
            videoDTO.setConversionStatus(ConversionStatus.COMPLETED);
            
            // Set the duration (in a real app, this would be extracted from the video)
            // For now, we'll set a placeholder value
            videoDTO.setDuration(180); // 3 minutes as default
            
            // Process optional comma-separated lists
            if (tagsStr != null && !tagsStr.isEmpty()) {
                for (String tag : tagsStr.split(",")) {
                    videoDTO.getTags().add(tag.trim());
                }
            }
            
            if (hashtagsStr != null && !hashtagsStr.isEmpty()) {
                for (String hashtag : hashtagsStr.split(",")) {
                    videoDTO.getHashtags().add(hashtag.trim());
                }
            }
            
            if (seoKeywordsStr != null && !seoKeywordsStr.isEmpty()) {
                for (String keyword : seoKeywordsStr.split(",")) {
                    videoDTO.getSeoKeywords().add(keyword.trim());
                }
            }
            
            // Create the video in the database
            VideoDTO createdVideo = videoService.createVideo(videoDTO);
            
            return new ResponseEntity<>(createdVideo, HttpStatus.CREATED);
            
        } catch (FileStorageException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error storing files: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error creating video: " + e.getMessage(), e);
        }
    }
    
    /**
     * Get all videos with pagination, sorting and filtering options
     * GET /admin/videos
     * 
     * @param pageable pagination and sorting information
     * @param title filter by title (optional)
     * @param isPremium filter by premium status (optional)
     * @param tag filter by tag (optional)
     * @param status filter by conversion status (optional)
     * @param startDate filter by upload date start (optional)
     * @param endDate filter by upload date end (optional)
     * @return page of videos matching the criteria
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllVideos(
            @PageableDefault(size = 10, sort = "uploadDate", direction = Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Boolean isPremium,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        // In a real application, we would pass these filters to the service layer
        // For now, we'll just get all videos with pagination
        Page<VideoDTO> videosPage = videoService.getAllVideosWithPagination(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("videos", videosPage.getContent());
        response.put("currentPage", videosPage.getNumber());
        response.put("totalItems", videosPage.getTotalElements());
        response.put("totalPages", videosPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get a single video by ID
     * GET /admin/videos/{id}
     * 
     * @param id the video ID
     * @return the video with the specified ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<VideoDTO> getVideoById(@PathVariable Long id) {
        try {
            VideoDTO video = videoService.getVideoById(id);
            return ResponseEntity.ok(video);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }
    
    /**
     * Update video metadata
     * PUT /admin/videos/{id}
     * 
     * @param id the video ID to update
     * @param videoDTO the new video data
     * @return the updated video
     */
    @PutMapping("/{id}")
    public ResponseEntity<VideoDTO> updateVideo(
            @PathVariable Long id,
            @Valid @RequestBody VideoDTO videoDTO) {
        try {
            // Ensure the path ID matches the body ID
            if (videoDTO.getId() != null && !videoDTO.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video ID in path does not match ID in request body");
            }
            
            VideoDTO updatedVideo = videoService.updateVideo(id, videoDTO);
            return ResponseEntity.ok(updatedVideo);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating video: " + e.getMessage(), e);
        }
    }
    
    /**
     * Delete a video (database entry and stored files)
     * DELETE /admin/videos/{id}
     * 
     * @param id the video ID to delete
     * @return success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteVideo(@PathVariable Long id) {
        try {
            // Get video details before deletion
            VideoDTO video = videoService.getVideoById(id);
            
            // Delete video from database
            videoService.deleteVideo(id);
            
            // Also delete the physical files
            try {
                // Delete video file if it exists
                if (video.getVideoUrl() != null) {
                    Path videoPath = Paths.get(fileStorageService.getVideoFilePath(video.getVideoUrl()));
                    Files.deleteIfExists(videoPath);
                }
                
                // Delete thumbnail file if it exists
                if (video.getThumbnailUrl() != null) {
                    Path thumbnailPath = Paths.get(fileStorageService.getThumbnailFilePath(video.getThumbnailUrl()));
                    Files.deleteIfExists(thumbnailPath);
                }
            } catch (Exception e) {
                // Log the error but don't fail the request, since the DB entry is already deleted
                System.err.println("Error deleting video files: " + e.getMessage());
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Video with ID " + id + " was deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error deleting video: " + e.getMessage(), e);
        }
    }
    
    /**
     * Update a video's thumbnail image
     * POST /admin/videos/{id}/thumbnail
     * 
     * @param id the video ID
     * @param thumbnailFile the new thumbnail image
     * @return the updated video
     */
    @PostMapping(value = "/{id}/thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VideoDTO> updateThumbnail(
            @PathVariable Long id,
            @RequestParam("thumbnailFile") MultipartFile thumbnailFile) {
        try {
            // Get current video
            VideoDTO currentVideo = videoService.getVideoById(id);
            
            // Store new thumbnail
            FileUploadResponse thumbnailResponse = fileStorageService.storeThumbnailFile(thumbnailFile);
            
            // Delete old thumbnail if it exists
            try {
                if (currentVideo.getThumbnailUrl() != null) {
                    Path oldThumbnailPath = Paths.get(fileStorageService.getThumbnailFilePath(currentVideo.getThumbnailUrl()));
                    Files.deleteIfExists(oldThumbnailPath);
                }
            } catch (Exception e) {
                // Log but continue
                System.err.println("Error deleting old thumbnail: " + e.getMessage());
            }
            
            // Update video with new thumbnail URL
            currentVideo.setThumbnailUrl(thumbnailResponse.getFilePath());
            VideoDTO updatedVideo = videoService.updateVideo(id, currentVideo);
            
            return ResponseEntity.ok(updatedVideo);
        } catch (EntityNotFoundException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error updating thumbnail: " + e.getMessage(), e);
        }
    }
}
