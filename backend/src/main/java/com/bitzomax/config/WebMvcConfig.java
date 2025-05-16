package com.bitzomax.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Web MVC configuration
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${file.video-upload-dir:./uploads/videos}")
    private String videoUploadDir;
    
    @Value("${file.thumbnail-upload-dir:./uploads/thumbnails}")
    private String thumbnailUploadDir;
      @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Register resource handlers for uploaded content
        exposeDirectory(videoUploadDir, "videos", registry);
        exposeDirectory(thumbnailUploadDir, "thumbnails", registry);
    }
    
    private void exposeDirectory(String directoryPath, String urlPath, ResourceHandlerRegistry registry) {
        Path uploadDir = Paths.get(directoryPath);
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        
        if (urlPath.endsWith("/")) {
            urlPath = urlPath.substring(0, urlPath.length() - 1);
        }
        
        registry.addResourceHandler("/" + urlPath + "/**")
                .addResourceLocations("file:" + uploadPath + "/");
    }
}