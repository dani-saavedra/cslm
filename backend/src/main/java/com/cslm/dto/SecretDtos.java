package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class SecretDtos {

    public record SecretResponse(
            Long id, String name,
            Long secretTypeId, String secretTypeName,
            String description, String storageSystem, String secretReference,
            Long environmentId, String environmentName,
            String owner, Long teamId, String teamName, String contactEmail,
            LocalDate expirationDate, Long daysRemaining, String semaphoreStatus,
            String status, String notes,
            List<CommonDtos.ApplicationSummary> applications,
            List<CommonDtos.DeploymentSummary> deployments,
            LocalDateTime createdAt, LocalDateTime updatedAt
    ) {}

    public record SecretRequest(
            @NotBlank String name, Long secretTypeId, String description,
            String storageSystem, String secretReference,
            @NotNull Long environmentId,
            String owner, Long teamId, String contactEmail,
            LocalDate expirationDate, String status, String notes,
            List<Long> applicationIds
    ) {}
}
