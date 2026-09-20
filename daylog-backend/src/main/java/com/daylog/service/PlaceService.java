package com.daylog.service;

import com.daylog.dto.PlaceCreateRequest;
import com.daylog.dto.PlaceResponse;
import com.daylog.entity.AppUser;
import com.daylog.entity.Place;
import com.daylog.exception.ResourceNotFoundException;
import com.daylog.repository.PlaceRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaceService {
    private final PlaceRepository placeRepository;

    public PlaceService(PlaceRepository placeRepository) {
        this.placeRepository = placeRepository;
    }

    @Transactional
    public PlaceResponse create(AppUser user, PlaceCreateRequest request) {
        Place place = placeRepository.save(new Place(
            user,
            request.name().trim(),
            request.latitude(),
            request.longitude(),
            request.radius()
        ));
        return PlaceResponse.from(place);
    }

    @Transactional(readOnly = true)
    public List<PlaceResponse> list(AppUser user) {
        return placeRepository.findAllForUser(user.getId()).stream()
            .map(PlaceResponse::from)
            .toList();
    }

    @Transactional
    public void delete(AppUser user, Long placeId) {
        Place place = placeRepository.findForUser(placeId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Place was not found"));
        placeRepository.delete(place);
    }

    @Transactional(readOnly = true)
    public Place findForUser(AppUser user, Long placeId) {
        return placeRepository.findForUser(placeId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Place was not found"));
    }
}