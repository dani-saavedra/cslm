package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.Application;
import com.cslm.domain.ApplicationAsset;
import com.cslm.domain.AssetCategory;
import com.cslm.dto.ApplicationAssetDtos.LinkAssetRequest;
import com.cslm.exception.BadRequestException;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.ApplicationAssetRepository;
import com.cslm.repository.ApplicationRepository;
import com.cslm.repository.CertificateRepository;
import com.cslm.repository.SecretRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationAssetService {

    private final ApplicationAssetRepository applicationAssetRepository;
    private final ApplicationRepository applicationRepository;
    private final CertificateRepository certificateRepository;
    private final SecretRepository secretRepository;
    private final AuditService auditService;

    public void link(LinkAssetRequest request) {
        Application app = applicationRepository.findById(request.applicationId())
                .orElseThrow(() -> ResourceNotFoundException.of("Application", request.applicationId()));
        AssetCategory type = AssetCategory.valueOf(request.assetType().toUpperCase());
        assertAssetExists(type, request.assetId());

        if (applicationAssetRepository.existsByApplicationIdAndAssetTypeAndAssetId(app.getId(), type, request.assetId())) {
            throw new BadRequestException("This asset is already linked to the application");
        }

        ApplicationAsset link = ApplicationAsset.builder()
                .application(app)
                .assetType(type)
                .assetId(request.assetId())
                .isPrimary(request.isPrimary() == null || request.isPrimary())
                .build();
        applicationAssetRepository.save(link);
        auditService.logCreate("ApplicationAsset", app.getId() + ":" + type + ":" + request.assetId());
    }

    public void unlink(Long applicationId, String assetType, Long assetId) {
        AssetCategory type = AssetCategory.valueOf(assetType.toUpperCase());
        ApplicationAsset link = applicationAssetRepository
                .findByApplicationIdAndAssetTypeAndAssetId(applicationId, type, assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Link not found between application " + applicationId + " and " + type + " " + assetId));
        applicationAssetRepository.delete(link);
        auditService.logDelete("ApplicationAsset", applicationId + ":" + type + ":" + assetId);
    }

    private void assertAssetExists(AssetCategory type, Long assetId) {
        boolean exists = type == AssetCategory.CERTIFICATE
                ? certificateRepository.existsById(assetId)
                : secretRepository.existsById(assetId);
        if (!exists) {
            throw ResourceNotFoundException.of(type.name(), assetId);
        }
    }
}
