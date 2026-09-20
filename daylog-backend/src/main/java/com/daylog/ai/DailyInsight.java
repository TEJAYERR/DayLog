package com.daylog.ai;

import com.daylog.dto.TimeBreakdownItem;
import java.util.List;

public record DailyInsight(
    String summary,
    List<String> highlights,
    List<TimeBreakdownItem> timeBreakdown,
    List<String> observations
) {
    public DailyInsight {
        highlights = highlights == null ? List.of() : List.copyOf(highlights);
        timeBreakdown = timeBreakdown == null ? List.of() : List.copyOf(timeBreakdown);
        observations = observations == null ? List.of() : List.copyOf(observations);
    }
}