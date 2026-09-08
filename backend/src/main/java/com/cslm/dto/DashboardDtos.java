package com.cslm.dto;

import java.time.LocalDate;
import java.util.Map;

public class DashboardDtos {

    public record DashboardSummaryResponse(
            long totalCertificates, long totalSecrets, long totalApplications, long totalEnvironments,
            long certificatesExpiringSoon, long secretsExpiringSoon,
            long certificatesExpired, long secretsExpired,
            Map<String, Long> semaphoreCounts
    ) {}

    public record ExpiringAssetResponse(
            String assetType, Long assetId, String name,
            String applicationNames, String environmentName, String owner,
            LocalDate expirationDate, Long daysRemaining, String semaphoreStatus
    ) {}
}
