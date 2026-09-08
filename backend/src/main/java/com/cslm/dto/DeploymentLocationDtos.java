package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class DeploymentLocationDtos {

    public record DeploymentLocationResponse(
            Long id, String name, Long locationTypeId, String locationTypeName,
            String cluster, String namespace, String description, Boolean active,
            LocalDateTime createdAt, LocalDateTime updatedAt
    ) {}

    public record DeploymentLocationRequest(
            @NotBlank String name, @NotNull Long locationTypeId,
            String cluster, String namespace, String description, Boolean active
    ) {}
}
