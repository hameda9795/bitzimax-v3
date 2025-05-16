package com.bitzomax.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Jackson configuration to ensure proper date formatting in API responses
 */
@Configuration
public class JacksonConfig {

    private static final String DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS";

    /**
     * Configure ObjectMapper for proper date serialization
     */
    @Bean
    public ObjectMapper objectMapper() {
        JavaTimeModule module = new JavaTimeModule();
        LocalDateTimeSerializer localDateTimeSerializer = new LocalDateTimeSerializer(
                DateTimeFormatter.ofPattern(DATE_TIME_FORMAT));
        module.addSerializer(LocalDateTime.class, localDateTimeSerializer);

        return Jackson2ObjectMapperBuilder.json()
                .modules(module)
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
    }
}