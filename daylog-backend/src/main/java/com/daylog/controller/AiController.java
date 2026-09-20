package com.daylog.controller;

import com.daylog.dto.AskDayRequest;
import com.daylog.dto.AskDayResponse;
import com.daylog.dto.DailyInsightResponse;
import com.daylog.dto.ExplainDayRequest;
import com.daylog.entity.AppUser;
import com.daylog.service.AiService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/explain-day")
    public DailyInsightResponse explainDay(@AuthenticationPrincipal AppUser user,
                                           @Valid @RequestBody ExplainDayRequest request) {
        return aiService.explainDay(user, request);
    }

    @PostMapping("/ask")
    public AskDayResponse ask(@AuthenticationPrincipal AppUser user,
                              @Valid @RequestBody AskDayRequest request) {
        return aiService.ask(user, request);
    }
}