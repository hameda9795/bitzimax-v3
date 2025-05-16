package com.bitzomax.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.CorsFilter;

/**
 * Security configuration for the application
 * Basic setup that allows all requests but ensures CORS support works properly
 * Will be enhanced later with proper authentication and authorization
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    private final CorsFilter corsFilter;
    
    public SecurityConfig(CorsFilter corsFilter) {
        this.corsFilter = corsFilter;
    }
    
    /**
     * Configure security for the application
     * Currently set to permit all requests, but with CORS support
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for now - will be configured properly when adding authentication
            .csrf(csrf -> csrf.disable())
            
            // Add the CORS filter before the UsernamePasswordAuthenticationFilter
            .addFilterBefore(corsFilter, UsernamePasswordAuthenticationFilter.class)
            
            // Set session management to STATELESS as this is an API
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // Set authorization rules - currently permitting all requests
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            );
            
        return http.build();
    }
}
