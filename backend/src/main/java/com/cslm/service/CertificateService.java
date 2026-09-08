package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.*;
import com.cslm.dto.CertificateDtos.CertificateRequest;
import com.cslm.dto.CertificateDtos.CertificateResponse;
import com.cslm.dto.CommonDtos.ApplicationSummary;
import com.cslm.dto.CommonDtos.DeploymentSummary;
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
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final AssetTypeRepository assetTypeRepository;
    private final EnvironmentRepository environmentRepository;
    private final TeamRepository teamRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationAssetRepository applicationAssetRepository;
    private final AssetDeploymentRepository assetDeploymentRepository;
    private final SemaphoreService semaphoreService;
    private final AuditService auditService;

    public Page<CertificateResponse> search(Long environmentId, Boolean production, String status, Long typeId,
                                             Long applicationId, String search, Pageable pageable) {
        return certificateRepository.search(environmentId, production, status, typeId, applicationId, search, pageable)
                .map(this::toResponse);
    }

    public CertificateResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    public CertificateResponse create(CertificateRequest request) {
        Certificate cert = new Certificate();
        applyRequest(cert, request);
        cert = certificateRepository.save(cert);
        auditService.logCreate("Certificate", cert.getId());
        syncApplicationLinks(cert.getId(), request.applicationIds());
        return toResponse(getEntity(cert.getId()));
    }

    public CertificateResponse update(Long id, CertificateRequest request) {
        Certificate cert = getEntity(id);
        auditService.logFieldChange("Certificate", id, "expirationDate", cert.getExpirationDate(), request.expirationDate());
        auditService.logFieldChange("Certificate", id, "status", cert.getStatus(), request.status());
        auditService.logFieldChange("Certificate", id, "owner", cert.getOwner(), request.owner());
        applyRequest(cert, request);
        cert = certificateRepository.save(cert);
        if (request.applicationIds() != null) {
            syncApplicationLinks(cert.getId(), request.applicationIds());
        }
        return toResponse(getEntity(cert.getId()));
    }

    public void delete(Long id) {
        Certificate cert = getEntity(id);
        applicationAssetRepository.deleteByAssetTypeAndAssetId(AssetCategory.CERTIFICATE, id);
        assetDeploymentRepository.deleteByAssetTypeAndAssetId(AssetCategory.CERTIFICATE, id);
        certificateRepository.delete(cert);
        auditService.logDelete("Certificate", id);
    }

    Certificate getEntity(Long id) {
        return certificateRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Certificate", id));
    }

    private void applyRequest(Certificate cert, CertificateRequest request) {
        cert.setName(request.name());
        cert.setAlias(request.alias());
        cert.setCertificateType(request.certificateTypeId() == null ? null :
                assetTypeRepository.findById(request.certificateTypeId())
                        .orElseThrow(() -> ResourceNotFoundException.of("AssetType", request.certificateTypeId())));
        cert.setCommonName(request.commonName());
        cert.setSubject(request.subject());
        cert.setIssuer(request.issuer());
        cert.setSerialNumber(request.serialNumber());
        cert.setAlgorithm(request.algorithm());
        cert.setKeySize(request.keySize());
        cert.setIssueDate(request.issueDate());
        cert.setExpirationDate(request.expirationDate());
        cert.setEnvironment(environmentRepository.findById(request.environmentId())
                .orElseThrow(() -> ResourceNotFoundException.of("Environment", request.environmentId())));
        cert.setOwner(request.owner());
        cert.setTeam(request.teamId() == null ? null :
                teamRepository.findById(request.teamId()).orElseThrow(() -> ResourceNotFoundException.of("Team", request.teamId())));
        cert.setContactEmail(request.contactEmail());
        cert.setNotes(request.notes());
        if (request.status() != null) {
            cert.setStatus(request.status());
        } else if (cert.getStatus() == null) {
            cert.setStatus("ACTIVE");
        }
    }

    private void syncApplicationLinks(Long certificateId, List<Long> applicationIds) {
        if (applicationIds == null) {
            return;
        }
        applicationAssetRepository.deleteByAssetTypeAndAssetId(AssetCategory.CERTIFICATE, certificateId);
        for (Long appId : applicationIds) {
            var app = applicationRepository.findById(appId).orElseThrow(() -> ResourceNotFoundException.of("Application", appId));
            applicationAssetRepository.save(ApplicationAsset.builder()
                    .application(app).assetType(AssetCategory.CERTIFICATE).assetId(certificateId).isPrimary(true).build());
        }
    }

    private CertificateResponse toResponse(Certificate c) {
        List<ApplicationSummary> applications = applicationAssetRepository
                .findByAssetTypeAndAssetId(AssetCategory.CERTIFICATE, c.getId()).stream()
                .map(aa -> new ApplicationSummary(aa.getApplication().getId(), aa.getApplication().getName(), aa.getApplication().getCode()))
                .toList();

        List<DeploymentSummary> deployments = assetDeploymentRepository
                .findByAssetTypeAndAssetId(AssetCategory.CERTIFICATE, c.getId()).stream()
                .map(d -> new DeploymentSummary(d.getId(), d.getDeploymentLocation().getId(), d.getDeploymentLocation().getName(),
                        d.getDeploymentLocation().getLocationType().getCode(), d.getDeploymentLocation().getCluster(),
                        d.getDeploymentLocation().getNamespace(), d.getReference(),
                        d.getApplication() == null ? null : d.getApplication().getId(),
                        d.getApplication() == null ? null : d.getApplication().getName()))
                .toList();

        return new CertificateResponse(
                c.getId(), c.getName(), c.getAlias(),
                c.getCertificateType() == null ? null : c.getCertificateType().getId(),
                c.getCertificateType() == null ? null : c.getCertificateType().getName(),
                c.getCommonName(), c.getSubject(), c.getIssuer(), c.getSerialNumber(),
                c.getAlgorithm(), c.getKeySize(), c.getIssueDate(), c.getExpirationDate(),
                semaphoreService.daysRemaining(c.getExpirationDate()),
                semaphoreService.statusFor(c.getExpirationDate()).name(),
                c.getEnvironment().getId(), c.getEnvironment().getName(),
                c.getOwner(), c.getTeam() == null ? null : c.getTeam().getId(),
                c.getTeam() == null ? null : c.getTeam().getName(), c.getContactEmail(),
                c.getNotes(), c.getStatus(), applications, deployments, c.getCreatedAt(), c.getUpdatedAt());
    }
}
