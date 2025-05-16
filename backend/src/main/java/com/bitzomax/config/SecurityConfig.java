package com.bitzomax.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authorize -> authorize
                // Allow access to static resources and fix endpoints
                .requestMatchers("/api/files/**").permitAll()
                .requestMatchers("/api/fix-videos/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/videos/**").permitAll()
                .requestMatchers("/thumbnails/**").permitAll()
                .requestMatchers("/fix-videos.html").permitAll()
                .requestMatchers("/static/**").permitAll()
                // Secure other endpoints as needed
                .anyRequest().permitAll()
            );
        
        return http.build();
    }
}
