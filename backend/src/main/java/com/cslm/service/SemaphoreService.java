package com.cslm.service;

import com.cslm.domain.SemaphoreStatus;
import com.cslm.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class SemaphoreService {

    private final SystemSettingRepository systemSettingRepository;

    private static final String KEY_RED = "SEMAPHORE_RED_MAX_DAYS";
    private static final String KEY_ORANGE = "SEMAPHORE_ORANGE_MAX_DAYS";
    private static final String KEY_YELLOW = "SEMAPHORE_YELLOW_MAX_DAYS";

    private static final long DEFAULT_RED = 7;
    private static final long DEFAULT_ORANGE = 30;
    private static final long DEFAULT_YELLOW = 90;

    public long daysRemaining(LocalDate expirationDate) {
        if (expirationDate == null) {
            return Long.MAX_VALUE;
        }
        return ChronoUnit.DAYS.between(LocalDate.now(), expirationDate);
    }

    public SemaphoreStatus statusFor(LocalDate expirationDate) {
        if (expirationDate == null) {
            return SemaphoreStatus.GREEN;
        }
        long days = daysRemaining(expirationDate);
        if (days < 0) {
            return SemaphoreStatus.EXPIRED;
        }
        long red = threshold(KEY_RED, DEFAULT_RED);
        long orange = threshold(KEY_ORANGE, DEFAULT_ORANGE);
        long yellow = threshold(KEY_YELLOW, DEFAULT_YELLOW);

        if (days <= red) {
            return SemaphoreStatus.RED;
        } else if (days <= orange) {
            return SemaphoreStatus.ORANGE;
        } else if (days <= yellow) {
            return SemaphoreStatus.YELLOW;
        }
        return SemaphoreStatus.GREEN;
    }

    public long yellowMaxDays() {
        return threshold(KEY_YELLOW, DEFAULT_YELLOW);
    }

    private long threshold(String key, long defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(s -> {
                    try {
                        return Long.parseLong(s.getSettingValue());
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }
}
