package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class AssetDeploymentDtos {

    public record AssetDeploymentRequest(
            @NotBlank String assetType, // CERTIFICATE | SECRET
            @NotNull Long assetId,
            @NotNull Long deploymentLocationId,
            Long applicationId,
            String reference,
            String notes
    ) {}
}
