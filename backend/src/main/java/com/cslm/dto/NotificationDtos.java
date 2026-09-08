package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class NotificationDtos {

    public record NotificationRuleResponse(
            Long id, String name, String assetCategory, Integer daysBefore, Boolean enabled,
            LocalDateTime createdAt, LocalDateTime updatedAt
    ) {}

    public record NotificationRuleRequest(
            @NotBlank String name, @NotBlank String assetCategory, @NotNull Integer daysBefore, Boolean enabled
    ) {}

    public record NotificationHistoryResponse(
            Long id, String assetType, Long assetId, String assetName,
            Long ruleId, String ruleName, String recipient, String subject,
            String status, String errorMessage, LocalDateTime sentAt
    ) {}

    public record TestNotificationRequest(
            @NotBlank String assetType, @NotNull Long assetId
    ) {}
}
