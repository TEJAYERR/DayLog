package com.daylog.service;

import com.daylog.ai.AiProvider;
import com.daylog.ai.DailyInsight;
import com.daylog.dto.AskDayRequest;
import com.daylog.dto.AskDayResponse;
import com.daylog.dto.DailyInsightResponse;
import com.daylog.dto.ExplainDayRequest;
import com.daylog.entity.AppUser;
import com.daylog.entity.DayEvent;
import com.daylog.repository.DayEventRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiService {
    private final DayEventRepository eventRepository;
    private final AiProvider aiProvider;

    public AiService(DayEventRepository eventRepository, AiProvider aiProvider) {
        this.eventRepository = eventRepository;
        this.aiProvider = aiProvider;
    }

    @Transactional(readOnly = true)
    public DailyInsightResponse explainDay(AppUser user, ExplainDayRequest request) {
        List<DayEvent> events = eventsForDate(user, request.date());
        DailyInsight insight = aiProvider.explainDay(request.date(), events);
        return new DailyInsightResponse(
            insight.summary(),
            insight.highlights(),
            insight.timeBreakdown(),
            insight.observations()
        );
    }

    @Transactional(readOnly = true)
    public AskDayResponse ask(AppUser user, AskDayRequest request) {
        List<DayEvent> events = eventsForDate(user, request.date());
        return new AskDayResponse(aiProvider.answerQuestion(request.date(), request.question(), events));
    }

    private List<DayEvent> eventsForDate(AppUser user, java.time.LocalDate date) {
        return eventRepository.findForDate(
            user.getId(),
            date.atStartOfDay(),
            date.plusDays(1).atStartOfDay()
        );
    }
}