package com.cslm.dto;

import com.cslm.dto.CertificateDtos.CertificateResponse;
import com.cslm.dto.SecretDtos.SecretResponse;

import java.util.List;

public record ApplicationAssetsResponse(
        Long applicationId,
        String applicationName,
        List<EnvironmentAssets> environments
) {
    public record EnvironmentAssets(
            Long environmentId,
            String environmentName,
            List<CertificateResponse> certificates,
            List<SecretResponse> secrets
    ) {}
}
