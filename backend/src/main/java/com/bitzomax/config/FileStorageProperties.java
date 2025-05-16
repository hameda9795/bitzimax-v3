package com.bitzomax.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "file")
public class FileStorageProperties {
    
    private String videoUploadDir;
    private String thumbnailUploadDir;
    
    public String getVideoUploadDir() {
        return videoUploadDir;
    }
    
    public void setVideoUploadDir(String videoUploadDir) {
        this.videoUploadDir = videoUploadDir;
    }
    
    public String getThumbnailUploadDir() {
        return thumbnailUploadDir;
    }
    
    public void setThumbnailUploadDir(String thumbnailUploadDir) {
        this.thumbnailUploadDir = thumbnailUploadDir;
    }
}
