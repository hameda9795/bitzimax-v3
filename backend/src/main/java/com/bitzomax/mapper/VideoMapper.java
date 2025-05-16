package com.bitzomax.mapper;

import com.bitzomax.dto.VideoDTO;
import com.bitzomax.model.Video;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Mapper for converting between Video entity and VideoDTO
 */
@Component
public class VideoMapper {

    /**
     * Convert Video entity to VideoDTO
     */
    public VideoDTO toDto(Video video) {
        if (video == null) {
            return null;
        }

        VideoDTO dto = new VideoDTO();
        dto.setId(video.getId());
        dto.setTitle(video.getTitle());
        dto.setVideoUrl(video.getVideoUrl());
        dto.setThumbnailUrl(video.getThumbnailUrl());
        dto.setDescription(video.getDescription());
        dto.setDuration(video.getDuration());
        // Ensure we have a valid upload date
        if (video.getUploadDate() != null) {
            dto.setUploadDate(video.getUploadDate());
        } else {
            dto.setUploadDate(LocalDateTime.now());
        }
        dto.setViews(video.getViews());
        dto.setLikes(video.getLikes());
        dto.setCommentCount(video.getCommentCount());
        dto.setShareCount(video.getShareCount());
        dto.setEngagementRate(video.getEngagementRate());
        dto.setIsPremium(video.getIsPremium());
        dto.setPoemText(video.getPoemText());
        dto.setOriginalFormat(video.getOriginalFormat());
        dto.setSeoDescription(video.getSeoDescription());
        dto.setSeoTitle(video.getSeoTitle());
        dto.setTags(video.getTags());
        dto.setHashtags(video.getHashtags());
        dto.setSeoKeywords(video.getSeoKeywords());
        dto.setConversionStatus(video.getConversionStatus());
        dto.setIsVisible(video.getIsVisible());
        
        return dto;
    }
    
    /**
     * Convert VideoDTO to Video entity
     */
    public Video toEntity(VideoDTO dto) {
        if (dto == null) {
            return null;
        }

        Video video = new Video();
        video.setId(dto.getId());
        video.setTitle(dto.getTitle());
        video.setVideoUrl(dto.getVideoUrl());
        video.setThumbnailUrl(dto.getThumbnailUrl());
        video.setDescription(dto.getDescription());
        video.setDuration(dto.getDuration());
        video.setUploadDate(dto.getUploadDate());
        video.setViews(dto.getViews());
        video.setLikes(dto.getLikes());
        video.setCommentCount(dto.getCommentCount());
        video.setShareCount(dto.getShareCount());
        video.setEngagementRate(dto.getEngagementRate());
        video.setIsPremium(dto.getIsPremium());
        video.setPoemText(dto.getPoemText());
        video.setOriginalFormat(dto.getOriginalFormat());
        video.setSeoDescription(dto.getSeoDescription());
        video.setSeoTitle(dto.getSeoTitle());
        video.setTags(dto.getTags());
        video.setHashtags(dto.getHashtags());
        video.setSeoKeywords(dto.getSeoKeywords());
        video.setConversionStatus(dto.getConversionStatus());
        video.setIsVisible(dto.getIsVisible());
        
        return video;
    }
    
    /**
     * Update a Video entity with data from VideoDTO
     */
    public void updateEntityFromDto(VideoDTO dto, Video video) {
        if (dto == null || video == null) {
            return;
        }
        
        // Only update fields that are not null in the DTO
        if (dto.getTitle() != null) video.setTitle(dto.getTitle());
        if (dto.getVideoUrl() != null) video.setVideoUrl(dto.getVideoUrl());
        if (dto.getThumbnailUrl() != null) video.setThumbnailUrl(dto.getThumbnailUrl());
        if (dto.getDescription() != null) video.setDescription(dto.getDescription());
        if (dto.getDuration() != null) video.setDuration(dto.getDuration());
        if (dto.getUploadDate() != null) video.setUploadDate(dto.getUploadDate());
        if (dto.getViews() != null) video.setViews(dto.getViews());
        if (dto.getLikes() != null) video.setLikes(dto.getLikes());
        if (dto.getCommentCount() != null) video.setCommentCount(dto.getCommentCount());
        if (dto.getShareCount() != null) video.setShareCount(dto.getShareCount());
        if (dto.getEngagementRate() != null) video.setEngagementRate(dto.getEngagementRate());
        if (dto.getIsPremium() != null) video.setIsPremium(dto.getIsPremium());
        if (dto.getPoemText() != null) video.setPoemText(dto.getPoemText());
        if (dto.getOriginalFormat() != null) video.setOriginalFormat(dto.getOriginalFormat());
        if (dto.getSeoDescription() != null) video.setSeoDescription(dto.getSeoDescription());
        if (dto.getSeoTitle() != null) video.setSeoTitle(dto.getSeoTitle());
        if (dto.getTags() != null) video.setTags(dto.getTags());
        if (dto.getHashtags() != null) video.setHashtags(dto.getHashtags());
        if (dto.getSeoKeywords() != null) video.setSeoKeywords(dto.getSeoKeywords());
        if (dto.getConversionStatus() != null) video.setConversionStatus(dto.getConversionStatus());
        if (dto.getIsVisible() != null) video.setIsVisible(dto.getIsVisible());
    }
}