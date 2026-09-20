package com.daylog.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PlaceCreateRequest(
    @NotBlank(message = "Place name is required")
    @Size(max = 120, message = "Place name must be at most 120 characters")
    String name,

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be at least -90")
    @DecimalMax(value = "90.0", message = "Latitude must be at most 90")
    Double latitude,

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be at least -180")
    @DecimalMax(value = "180.0", message = "Longitude must be at most 180")
    Double longitude,

    @NotNull(message = "Radius is required")
    @DecimalMin(value = "1.0", message = "Radius must be at least 1 meter")
    @DecimalMax(value = "100000.0", message = "Radius must be at most 100000 meters")
    Double radius
) {
}