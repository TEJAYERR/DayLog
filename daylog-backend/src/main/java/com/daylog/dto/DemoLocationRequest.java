package com.daylog.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record DemoLocationRequest(
    @NotNull(message = "Place is required")
    Long placeId,

    @NotNull(message = "Action is required")
    DemoLocationAction action,

    LocalDateTime timestamp,

    @Size(max = 4000, message = "Description must be at most 4000 characters")
    String description
) {
}