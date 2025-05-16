package com.bitzomax.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * Web configuration for CORS and resource handling
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final FileStorageProperties fileStorageProperties;
    
    @Autowired
    public WebConfig(FileStorageProperties fileStorageProperties) {
        this.fileStorageProperties = fileStorageProperties;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:4200")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map video files URL to the physical location
        registry.addResourceHandler("/api/files/videos/**")
                .addResourceLocations("file:" + fileStorageProperties.getVideoUploadDir() + "/");
        
        // Map thumbnail files URL to the physical location
        registry.addResourceHandler("/api/files/thumbnails/**")
                .addResourceLocations("file:" + fileStorageProperties.getThumbnailUploadDir() + "/");
    }

    /**
     * Creates a CORS filter to ensure CORS headers are applied to all responses
     * This is useful when working with security configurations
     */
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Allow requests from Angular dev server
        config.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        
        // Allow common HTTP methods
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        
        // Allow all headers
        config.setAllowedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization"));
        
        // Expose specific headers
        config.setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        
        // Allow cookies and auth headers
        config.setAllowCredentials(true);
        
        // Cache preflight requests for 1 hour (3600 seconds)
        config.setMaxAge(3600L);
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
