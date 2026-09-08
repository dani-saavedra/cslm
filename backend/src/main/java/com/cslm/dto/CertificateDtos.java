package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class CertificateDtos {

    public record CertificateResponse(
            Long id, String name, String alias,
            Long certificateTypeId, String certificateTypeName,
            String commonName, String subject, String issuer, String serialNumber,
            String algorithm, Integer keySize,
            LocalDate issueDate, LocalDate expirationDate,
            Long daysRemaining, String semaphoreStatus,
            Long environmentId, String environmentName,
            String owner, Long teamId, String teamName, String contactEmail,
            String notes, String status,
            List<CommonDtos.ApplicationSummary> applications,
            List<CommonDtos.DeploymentSummary> deployments,
            LocalDateTime createdAt, LocalDateTime updatedAt
    ) {}

    public record CertificateRequest(
            @NotBlank String name, String alias,
            Long certificateTypeId,
            String commonName, String subject, String issuer, String serialNumber,
            String algorithm, Integer keySize,
            LocalDate issueDate,
            @NotNull LocalDate expirationDate,
            @NotNull Long environmentId,
            String owner, Long teamId, String contactEmail, String notes, String status,
            List<Long> applicationIds
    ) {}
}
