package com.cslm.service;

import com.cslm.domain.SemaphoreStatus;
import com.cslm.repository.SystemSettingRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SemaphoreServiceTest {

    private final SystemSettingRepository settingRepository = mock(SystemSettingRepository.class);
    private final SemaphoreService semaphoreService = new SemaphoreService(settingRepository);

    @Test
    void greenWhenMoreThanNinetyDays() {
        when(settingRepository.findBySettingKey(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());

        LocalDate expiration = LocalDate.now().plusDays(227);
        assertThat(semaphoreService.statusFor(expiration)).isEqualTo(SemaphoreStatus.GREEN);
    }

    @Test
    void yellowBetween31And90Days() {
        when(settingRepository.findBySettingKey(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());

        assertThat(semaphoreService.statusFor(LocalDate.now().plusDays(76))).isEqualTo(SemaphoreStatus.YELLOW);
    }

    @Test
    void orangeBetween8And30Days() {
        when(settingRepository.findBySettingKey(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());

        assertThat(semaphoreService.statusFor(LocalDate.now().plusDays(15))).isEqualTo(SemaphoreStatus.ORANGE);
    }

    @Test
    void redBetween0And7Days() {
        when(settingRepository.findBySettingKey(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());

        assertThat(semaphoreService.statusFor(LocalDate.now().plusDays(5))).isEqualTo(SemaphoreStatus.RED);
    }

    @Test
    void expiredWhenPastDate() {
        when(settingRepository.findBySettingKey(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(java.util.Optional.empty());

        assertThat(semaphoreService.statusFor(LocalDate.now().minusDays(16))).isEqualTo(SemaphoreStatus.EXPIRED);
    }

    @Test
    void thresholdsAreConfigurable() {
        when(settingRepository.findBySettingKey("SEMAPHORE_RED_MAX_DAYS"))
                .thenReturn(java.util.Optional.of(com.cslm.domain.SystemSetting.builder().settingValue("14").build()));
        when(settingRepository.findBySettingKey("SEMAPHORE_ORANGE_MAX_DAYS"))
                .thenReturn(java.util.Optional.empty());
        when(settingRepository.findBySettingKey("SEMAPHORE_YELLOW_MAX_DAYS"))
                .thenReturn(java.util.Optional.empty());

        // 10 days would normally be ORANGE, but with a custom RED threshold of 14 it becomes RED
        assertThat(semaphoreService.statusFor(LocalDate.now().plusDays(10))).isEqualTo(SemaphoreStatus.RED);
    }
}
