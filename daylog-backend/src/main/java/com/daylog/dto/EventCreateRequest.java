package com.daylog.dto;

import com.daylog.entity.EventCategory;
import com.daylog.entity.EventSource;
import com.daylog.entity.EventType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record EventCreateRequest(
    @NotNull(message = "Event type is required")
    EventType eventType,

    @NotBlank(message = "Event title is required")
    @Size(max = 200, message = "Event title must be at most 200 characters")
    String title,

    @Size(max = 4000, message = "Description must be at most 4000 characters")
    String description,

    @NotNull(message = "Event timestamp is required")
    LocalDateTime timestamp,

    @DecimalMin(value = "-90.0", message = "Latitude must be at least -90")
    @DecimalMax(value = "90.0", message = "Latitude must be at most 90")
    Double latitude,

    @DecimalMin(value = "-180.0", message = "Longitude must be at least -180")
    @DecimalMax(value = "180.0", message = "Longitude must be at most 180")
    Double longitude,

    Long placeId,
    EventCategory category,
    EventSource source
) {
}