package com.daylog.dto;

import java.util.List;

public record DailyInsightResponse(
    String summary,
    List<String> highlights,
    List<TimeBreakdownItem> timeBreakdown,
    List<String> observations
) {
}