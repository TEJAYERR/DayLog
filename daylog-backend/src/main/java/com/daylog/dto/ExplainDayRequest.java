package com.daylog.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ExplainDayRequest(@NotNull(message = "Date is required") LocalDate date) {
}