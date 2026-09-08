package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.*;
import com.cslm.dto.CommonDtos.ApplicationSummary;
import com.cslm.dto.CommonDtos.DeploymentSummary;
import com.cslm.dto.SecretDtos.SecretRequest;
import com.cslm.dto.SecretDtos.SecretResponse;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SecretService {

    private final SecretRepository secretRepository;
    private final AssetTypeRepository assetTypeRepository;
    private final EnvironmentRepository environmentRepository;
    private final TeamRepository teamRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationAssetRepository applicationAssetRepository;
    private final AssetDeploymentRepository assetDeploymentRepository;
    private final SemaphoreService semaphoreService;
    private final AuditService auditService;

    public Page<SecretResponse> search(Long environmentId, Boolean production, String status, Long typeId,
                                        Long applicationId, String search, Pageable pageable) {
        return secretRepository.search(environmentId, production, status, typeId, applicationId, search, pageable)
                .map(this::toResponse);
    }

    public SecretResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    public SecretResponse create(SecretRequest request) {
        Secret secret = new Secret();
        applyRequest(secret, request);
        secret = secretRepository.save(secret);
        auditService.logCreate("Secret", secret.getId());
        syncApplicationLinks(secret.getId(), request.applicationIds());
        return toResponse(getEntity(secret.getId()));
    }

    public SecretResponse update(Long id, SecretRequest request) {
        Secret secret = getEntity(id);
        auditService.logFieldChange("Secret", id, "expirationDate", secret.getExpirationDate(), request.expirationDate());
        auditService.logFieldChange("Secret", id, "status", secret.getStatus(), request.status());
        auditService.logFieldChange("Secret", id, "owner", secret.getOwner(), request.owner());
        applyRequest(secret, request);
        secret = secretRepository.save(secret);
        if (request.applicationIds() != null) {
            syncApplicationLinks(secret.getId(), request.applicationIds());
        }
        return toResponse(getEntity(secret.getId()));
    }

    public void delete(Long id) {
        Secret secret = getEntity(id);
        applicationAssetRepository.deleteByAssetTypeAndAssetId(AssetCategory.SECRET, id);
        assetDeploymentRepository.deleteByAssetTypeAndAssetId(AssetCategory.SECRET, id);
        secretRepository.delete(secret);
        auditService.logDelete("Secret", id);
    }

    Secret getEntity(Long id) {
        return secretRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Secret", id));
    }

    private void applyRequest(Secret secret, SecretRequest request) {
        secret.setName(request.name());
        secret.setSecretType(request.secretTypeId() == null ? null :
                assetTypeRepository.findById(request.secretTypeId())
                        .orElseThrow(() -> ResourceNotFoundException.of("AssetType", request.secretTypeId())));
        secret.setDescription(request.description());
        secret.setStorageSystem(request.storageSystem());
        secret.setSecretReference(request.secretReference());
        secret.setEnvironment(environmentRepository.findById(request.environmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Environment", request.environmentId())));
        secret.setOwner(request.owner());
        secret.setTeam(request.teamId() == null ? null :
                teamRepository.findById(request.teamId()).orElseThrow(() -> ResourceNotFoundException.of("Team", request.teamId())));
        secret.setContactEmail(request.contactEmail());
        secret.setExpirationDate(request.expirationDate());
        secret.setNotes(request.notes());
        if (request.status() != null) {
            secret.setStatus(request.status());
        } else if (secret.getStatus() == null) {
            secret.setStatus("ACTIVE");
        }
    }

    private void syncApplicationLinks(Long secretId, List<Long> applicationIds) {
        if (applicationIds == null) {
            return;
        }
        applicationAssetRepository.deleteByAssetTypeAndAssetId(AssetCategory.SECRET, secretId);
        for (Long appId : applicationIds) {
            var app = applicationRepository.findById(appId).orElseThrow(() -> ResourceNotFoundException.of("Application", appId));
            applicationAssetRepository.save(ApplicationAsset.builder()
                    .application(app).assetType(AssetCategory.SECRET).assetId(secretId).isPrimary(true).build());
        }
    }

    private SecretResponse toResponse(Secret s) {
        List<ApplicationSummary> applications = applicationAssetRepository
                .findByAssetTypeAndAssetId(AssetCategory.SECRET, s.getId()).stream()
                .map(aa -> new ApplicationSummary(aa.getApplication().getId(), aa.getApplication().getName(), aa.getApplication().getCode()))
                .toList();

        List<DeploymentSummary> deployments = assetDeploymentRepository
                .findByAssetTypeAndAssetId(AssetCategory.SECRET, s.getId()).stream()
                .map(d -> new DeploymentSummary(d.getId(), d.getDeploymentLocation().getId(), d.getDeploymentLocation().getName(),
                        d.getDeploymentLocation().getLocationType().getCode(), d.getDeploymentLocation().getCluster(),
                        d.getDeploymentLocation().getNamespace(), d.getReference(),
                        d.getApplication() == null ? null : d.getApplication().getId(),
                        d.getApplication() == null ? null : d.getApplication().getName()))
                .toList();

        return new SecretResponse(
                s.getId(), s.getName(),
                s.getSecretType() == null ? null : s.getSecretType().getId(),
                s.getSecretType() == null ? null : s.getSecretType().getName(),
                s.getDescription(), s.getStorageSystem(), s.getSecretReference(),
                s.getEnvironment().getId(), s.getEnvironment().getName(),
                s.getOwner(), s.getTeam() == null ? null : s.getTeam().getId(),
                s.getTeam() == null ? null : s.getTeam().getName(), s.getContactEmail(),
                s.getExpirationDate(), semaphoreService.daysRemaining(s.getExpirationDate()),
                semaphoreService.statusFor(s.getExpirationDate()).name(),
                s.getStatus(), s.getNotes(), applications, deployments, s.getCreatedAt(), s.getUpdatedAt());
    }
}
