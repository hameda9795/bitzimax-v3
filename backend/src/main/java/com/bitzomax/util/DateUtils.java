package com.bitzomax.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility class for handling date conversions and formatting
 */
public class DateUtils {
    
    private static final String ISO_DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS";
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern(ISO_DATE_FORMAT);
    
    /**
     * Format a LocalDateTime to ISO string format
     * @param dateTime The LocalDateTime to format
     * @return Formatted date string
     */
    public static String formatToIsoString(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(ISO_FORMATTER);
    }
    
    /**
     * Parse an ISO string to LocalDateTime
     * @param dateTimeStr The date string to parse
     * @return LocalDateTime object
     */
    public static LocalDateTime parseFromIsoString(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDateTime.parse(dateTimeStr, ISO_FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Get current time as ISO string
     * @return Current time as ISO string
     */
    public static String nowAsIsoString() {
        return formatToIsoString(LocalDateTime.now());
    }
    
    /**
     * Ensure a LocalDateTime is not null by providing a default value
     * @param dateTime The LocalDateTime to check
     * @return The provided date or current date if null
     */
    public static LocalDateTime ensureNotNull(LocalDateTime dateTime) {
        return dateTime != null ? dateTime : LocalDateTime.now();
    }
}