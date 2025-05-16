package com.bitzomax.dto;

import com.bitzomax.model.ConversionStatus;
import com.bitzomax.model.Video;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Data Transfer Object for Video entity
 */
public class VideoDTO {
    private Long id;
    private String title;
    private String videoUrl;
    private String thumbnailUrl;
    private String description;
    private Integer duration;
    private LocalDateTime uploadDate;
    private Long views;
    private Long likes;
    private Long commentCount;
    private Long shareCount;
    private Double engagementRate;
    private Boolean isPremium;
    private String poemText;
    private String originalFormat;
    private String seoDescription;
    private String seoTitle;
    private Set<String> tags = new HashSet<>();
    private Set<String> hashtags = new HashSet<>();
    private Set<String> seoKeywords = new HashSet<>();
    private ConversionStatus conversionStatus;
    private Boolean isVisible;

    // Constructors
    public VideoDTO() {
        this.uploadDate = LocalDateTime.now();
        this.views = 0L;
        this.likes = 0L;
        this.commentCount = 0L;
        this.shareCount = 0L;
        this.engagementRate = 0.0;
        this.isVisible = true;
    }

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getThumbnailUrl() {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }

    public LocalDateTime getUploadDate() {
        return uploadDate;
    }

    public void setUploadDate(LocalDateTime uploadDate) {
        this.uploadDate = uploadDate;
    }

    public Long getViews() {
        return views;
    }

    public void setViews(Long views) {
        this.views = views;
    }

    public Long getLikes() {
        return likes;
    }

    public void setLikes(Long likes) {
        this.likes = likes;
    }

    public Long getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(Long commentCount) {
        this.commentCount = commentCount;
    }

    public Long getShareCount() {
        return shareCount;
    }

    public void setShareCount(Long shareCount) {
        this.shareCount = shareCount;
    }

    public Double getEngagementRate() {
        return engagementRate;
    }

    public void setEngagementRate(Double engagementRate) {
        this.engagementRate = engagementRate;
    }

    public Boolean getIsPremium() {
        return isPremium;
    }

    public void setIsPremium(Boolean isPremium) {
        this.isPremium = isPremium;
    }

    public String getPoemText() {
        return poemText;
    }

    public void setPoemText(String poemText) {
        this.poemText = poemText;
    }

    public String getOriginalFormat() {
        return originalFormat;
    }

    public void setOriginalFormat(String originalFormat) {
        this.originalFormat = originalFormat;
    }

    public String getSeoDescription() {
        return seoDescription;
    }

    public void setSeoDescription(String seoDescription) {
        this.seoDescription = seoDescription;
    }

    public String getSeoTitle() {
        return seoTitle;
    }

    public void setSeoTitle(String seoTitle) {
        this.seoTitle = seoTitle;
    }

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }

    public Set<String> getHashtags() {
        return hashtags;
    }

    public void setHashtags(Set<String> hashtags) {
        this.hashtags = hashtags;
    }

    public Set<String> getSeoKeywords() {
        return seoKeywords;
    }

    public void setSeoKeywords(Set<String> seoKeywords) {
        this.seoKeywords = seoKeywords;
    }

    public ConversionStatus getConversionStatus() {
        return conversionStatus;
    }

    public void setConversionStatus(ConversionStatus conversionStatus) {
        this.conversionStatus = conversionStatus;
    }

    public Boolean getIsVisible() {
        return isVisible;
    }

    public void setIsVisible(Boolean isVisible) {
        this.isVisible = isVisible;
    }

    /**
     * Convert a Video entity to VideoDTO
     *
     * @param video The Video entity to convert
     * @return The corresponding VideoDTO
     */
    public static VideoDTO fromEntity(Video video) {
        VideoDTO dto = new VideoDTO();
        dto.setId(video.getId());
        dto.setTitle(video.getTitle());
        dto.setDescription(video.getDescription());
        dto.setThumbnailUrl(video.getThumbnailUrl());
        dto.setVideoUrl(video.getVideoUrl());
        dto.setDuration(video.getDuration());
        dto.setViews(video.getViews());
        dto.setLikes(video.getLikes());
        dto.setIsPremium(video.getIsPremium());
        dto.setUploadDate(video.getUploadDate());
        dto.setTags(video.getTags());
        dto.setPoemText(video.getPoemText());
        dto.setHashtags(video.getHashtags());
        dto.setSeoTitle(video.getSeoTitle());
        dto.setSeoDescription(video.getSeoDescription());
        dto.setSeoKeywords(video.getSeoKeywords());
        dto.setOriginalFormat(video.getOriginalFormat());
        dto.setConversionStatus(video.getConversionStatus());
        dto.setIsVisible(video.getIsVisible());
        return dto;
    }

    /**
     * Convert a VideoDTO to Video entity
     *
     * @param dto The VideoDTO to convert
     * @return The corresponding Video entity
     */
    public Video toEntity() {
        Video video = new Video();
        video.setId(this.id);
        video.setTitle(this.title);
        video.setDescription(this.description);
        video.setThumbnailUrl(this.thumbnailUrl);
        video.setVideoUrl(this.videoUrl);
        video.setDuration(this.duration);
        video.setViews(this.views);
        video.setLikes(this.likes);
        video.setIsPremium(this.isPremium);
        video.setUploadDate(this.uploadDate);
        video.setTags(this.tags);
        video.setPoemText(this.poemText);
        video.setHashtags(this.hashtags);
        video.setSeoTitle(this.seoTitle);
        video.setSeoDescription(this.seoDescription);
        video.setSeoKeywords(this.seoKeywords);
        video.setOriginalFormat(this.originalFormat);
        video.setConversionStatus(this.conversionStatus);
        video.setIsVisible(this.isVisible);
        return video;
    }
}
