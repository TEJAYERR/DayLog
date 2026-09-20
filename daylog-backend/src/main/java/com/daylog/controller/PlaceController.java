package com.daylog.controller;

import com.daylog.dto.PlaceCreateRequest;
import com.daylog.dto.PlaceResponse;
import com.daylog.entity.AppUser;
import com.daylog.service.PlaceService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/places")
public class PlaceController {
    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @PostMapping
    public PlaceResponse create(@AuthenticationPrincipal AppUser user,
                                @Valid @RequestBody PlaceCreateRequest request) {
        return placeService.create(user, request);
    }

    @GetMapping
    public List<PlaceResponse> list(@AuthenticationPrincipal AppUser user) {
        return placeService.list(user);
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<Void> delete(@AuthenticationPrincipal AppUser user,
                                                                 @PathVariable Long id) {
        placeService.delete(user, id);
        return org.springframework.http.ResponseEntity.noContent().build();
    }
}