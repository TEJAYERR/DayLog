package com.daylog.dto;

import com.daylog.entity.DayEvent;
import com.daylog.entity.EventCategory;
import com.daylog.entity.EventSource;
import com.daylog.entity.EventType;
import java.time.Instant;
import java.time.LocalDateTime;

public record EventResponse(
    Long id,
    EventType eventType,
    String title,
    String description,
    LocalDateTime timestamp,
    Double latitude,
    Double longitude,
    Long placeId,
    String placeName,
    EventCategory category,
    EventSource source,
    Instant createdAt
) {
    public static EventResponse from(DayEvent event) {
        return new EventResponse(
            event.getId(),
            event.getEventType(),
            event.getTitle(),
            event.getDescription(),
            event.getTimestamp(),
            event.getLatitude(),
            event.getLongitude(),
            event.getPlace() == null ? null : event.getPlace().getId(),
            event.getPlace() == null ? null : event.getPlace().getName(),
            event.getCategory(),
            event.getSource(),
            event.getCreatedAt()
        );
    }
}