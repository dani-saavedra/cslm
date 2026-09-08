package com.cslm.dto;

public class CommonDtos {

    public record ApplicationSummary(Long id, String name, String code) {}

    public record DeploymentSummary(
            Long id, Long locationId, String locationName, String locationTypeCode,
            String cluster, String namespace, String reference, Long applicationId, String applicationName
    ) {}
}
