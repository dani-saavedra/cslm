package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.*;
import com.cslm.dto.AssetDeploymentDtos.AssetDeploymentRequest;
import com.cslm.dto.CommonDtos.DeploymentSummary;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AssetDeploymentService {

    private final AssetDeploymentRepository assetDeploymentRepository;
    private final DeploymentLocationRepository deploymentLocationRepository;
    private final ApplicationRepository applicationRepository;
    private final CertificateRepository certificateRepository;
    private final SecretRepository secretRepository;
    private final AuditService auditService;

    public List<DeploymentSummary> findForAsset(AssetCategory type, Long assetId) {
        return assetDeploymentRepository.findByAssetTypeAndAssetId(type, assetId).stream()
                .map(this::toSummary).toList();
    }

    public DeploymentSummary create(AssetDeploymentRequest request) {
        AssetCategory type = AssetCategory.valueOf(request.assetType().toUpperCase());
        assertAssetExists(type, request.assetId());

        DeploymentLocation location = deploymentLocationRepository.findById(request.deploymentLocationId())
                .orElseThrow(() -> ResourceNotFoundException.of("DeploymentLocation", request.deploymentLocationId()));

        Application app = request.applicationId() == null ? null :
                applicationRepository.findById(request.applicationId())
                        .orElseThrow(() -> ResourceNotFoundException.of("Application", request.applicationId()));

        AssetDeployment deployment = AssetDeployment.builder()
                .assetType(type)
                .assetId(request.assetId())
                .deploymentLocation(location)
                .application(app)
                .reference(request.reference())
                .notes(request.notes())
                .build();
        deployment = assetDeploymentRepository.save(deployment);
        auditService.logCreate("AssetDeployment", deployment.getId());
        return toSummary(deployment);
    }

    public void delete(Long id) {
        AssetDeployment deployment = assetDeploymentRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("AssetDeployment", id));
        assetDeploymentRepository.delete(deployment);
        auditService.logDelete("AssetDeployment", id);
    }

    private void assertAssetExists(AssetCategory type, Long assetId) {
        boolean exists = type == AssetCategory.CERTIFICATE
                ? certificateRepository.existsById(assetId)
                : secretRepository.existsById(assetId);
        if (!exists) {
            throw ResourceNotFoundException.of(type.name(), assetId);
        }
    }

    private DeploymentSummary toSummary(AssetDeployment d) {
        return new DeploymentSummary(
                d.getId(), d.getDeploymentLocation().getId(), d.getDeploymentLocation().getName(),
                d.getDeploymentLocation().getLocationType().getCode(),
                d.getDeploymentLocation().getCluster(), d.getDeploymentLocation().getNamespace(),
                d.getReference(), d.getApplication() == null ? null : d.getApplication().getId(),
                d.getApplication() == null ? null : d.getApplication().getName()
        );
    }
}
