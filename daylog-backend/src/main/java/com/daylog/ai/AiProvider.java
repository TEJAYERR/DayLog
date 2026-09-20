package com.daylog.ai;

import com.daylog.entity.DayEvent;
import java.time.LocalDate;
import java.util.List;

public interface AiProvider {
    DailyInsight explainDay(LocalDate date, List<DayEvent> events);

    String answerQuestion(LocalDate date, String question, List<DayEvent> events);
}