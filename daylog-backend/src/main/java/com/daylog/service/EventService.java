package com.daylog.service;

import com.daylog.dto.DemoLocationAction;
import com.daylog.dto.DemoLocationRequest;
import com.daylog.dto.EventCreateRequest;
import com.daylog.dto.EventResponse;
import com.daylog.entity.AppUser;
import com.daylog.entity.DayEvent;
import com.daylog.entity.EventSource;
import com.daylog.entity.EventType;
import com.daylog.entity.Place;
import com.daylog.exception.InvalidRequestException;
import com.daylog.exception.ResourceNotFoundException;
import com.daylog.repository.DayEventRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventService {
    private final DayEventRepository eventRepository;
    private final PlaceService placeService;

    public EventService(DayEventRepository eventRepository, PlaceService placeService) {
        this.eventRepository = eventRepository;
        this.placeService = placeService;
    }

    @Transactional
    public EventResponse create(AppUser user, EventCreateRequest request) {
        Place place = request.placeId() == null
            ? null
            : placeService.findForUser(user, request.placeId());
        if (request.eventType() == EventType.LOCATION && place == null) {
            throw new InvalidRequestException("Location events must reference one of your saved places");
        }
        if (request.eventType() == EventType.ACTIVITY && request.category() == null) {
            throw new InvalidRequestException("Activity events must include a category");
        }
        DayEvent event = eventRepository.save(new DayEvent(
            user,
            request.eventType(),
            request.title().trim(),
            request.description(),
            request.timestamp(),
            request.latitude(),
            request.longitude(),
            place,
            request.category(),
            request.source() == null ? EventSource.MANUAL : request.source()
        ));
        return EventResponse.from(event);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> listForDate(AppUser user, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();
        return eventRepository.findForDate(user.getId(), start, end).stream()
            .map(EventResponse::from)
            .toList();
    }

    @Transactional
    public void delete(AppUser user, Long eventId) {
        DayEvent event = eventRepository.findForUser(eventId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Event was not found"));
        eventRepository.delete(event);
    }

    @Transactional
    public EventResponse createDemoLocationEvent(AppUser user, DemoLocationRequest request) {
        Place place = placeService.findForUser(user, request.placeId());
        String action = request.action() == DemoLocationAction.ARRIVE ? "Arrived at " : "Left ";
        String defaultDescription = request.action() == DemoLocationAction.ARRIVE
            ? "Demo automatic location arrival"
            : "Demo automatic location departure";
        return create(user, new EventCreateRequest(
            EventType.LOCATION,
            action + place.getName(),
            request.description() == null || request.description().isBlank()
                ? defaultDescription
                : request.description(),
            request.timestamp() == null ? LocalDateTime.now() : request.timestamp(),
            place.getLatitude(),
            place.getLongitude(),
            place.getId(),
            null,
            EventSource.AUTOMATIC
        ));
    }
}