package com.cslm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ApplicationAssetDtos {

    public record LinkAssetRequest(
            @NotNull Long applicationId,
            @NotBlank String assetType, // CERTIFICATE | SECRET
            @NotNull Long assetId,
            Boolean isPrimary
    ) {}
}
