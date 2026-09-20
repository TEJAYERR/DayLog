package com.daylog.dto;

import com.daylog.entity.Place;
import java.time.Instant;

public record PlaceResponse(
    Long id,
    String name,
    double latitude,
    double longitude,
    double radius,
    Instant createdAt
) {
    public static PlaceResponse from(Place place) {
        return new PlaceResponse(
            place.getId(),
            place.getName(),
            place.getLatitude(),
            place.getLongitude(),
            place.getRadius(),
            place.getCreatedAt()
        );
    }
}