package com.daylog.controller;

import com.daylog.dto.DemoLocationRequest;
import com.daylog.dto.EventCreateRequest;
import com.daylog.dto.EventResponse;
import com.daylog.entity.AppUser;
import com.daylog.service.EventService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    public EventResponse create(@AuthenticationPrincipal AppUser user,
                                @Valid @RequestBody EventCreateRequest request) {
        return eventService.create(user, request);
    }

    @GetMapping
    public List<EventResponse> list(
        @AuthenticationPrincipal AppUser user,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return eventService.listForDate(user, date);
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<Void> delete(@AuthenticationPrincipal AppUser user,
                                                                 @PathVariable Long id) {
        eventService.delete(user, id);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    @PostMapping("/demo-location")
    public EventResponse createDemoLocation(@AuthenticationPrincipal AppUser user,
                                             @Valid @RequestBody DemoLocationRequest request) {
        return eventService.createDemoLocationEvent(user, request);
    }
}