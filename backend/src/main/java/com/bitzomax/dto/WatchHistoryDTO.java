package com.bitzomax.dto;

import com.bitzomax.model.WatchHistory;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for WatchHistory entity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchHistoryDTO {
    
    private Long id;
    private Long userId;
    private Long videoId;
    private LocalDateTime timestamp;
    private Integer watchDuration;
    private Boolean completed;

    /**
     * Convert a WatchHistory entity to WatchHistoryDTO
     *
     * @param watchHistory The WatchHistory entity to convert
     * @return The corresponding WatchHistoryDTO
     */
    public static WatchHistoryDTO fromEntity(WatchHistory watchHistory) {
        WatchHistoryDTO dto = new WatchHistoryDTO();
        dto.setId(watchHistory.getId());
        dto.setUserId(watchHistory.getUser().getId());
        dto.setVideoId(watchHistory.getVideo().getId());
        dto.setTimestamp(watchHistory.getTimestamp());
        dto.setWatchDuration(watchHistory.getWatchDuration());
        dto.setCompleted(watchHistory.getCompleted());
        return dto;
    }
}
