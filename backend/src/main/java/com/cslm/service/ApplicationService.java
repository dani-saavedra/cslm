package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.Application;
import com.cslm.domain.AssetCategory;
import com.cslm.domain.Environment;
import com.cslm.domain.Team;
import com.cslm.dto.ApplicationAssetsResponse;
import com.cslm.dto.ApplicationAssetsResponse.EnvironmentAssets;
import com.cslm.dto.ApplicationDtos.ApplicationRequest;
import com.cslm.dto.ApplicationDtos.ApplicationResponse;
import com.cslm.dto.CertificateDtos.CertificateResponse;
import com.cslm.dto.SecretDtos.SecretResponse;
import com.cslm.exception.BadRequestException;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.ApplicationAssetRepository;
import com.cslm.repository.ApplicationRepository;
import com.cslm.repository.EnvironmentRepository;
import com.cslm.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final TeamRepository teamRepository;
    private final EnvironmentRepository environmentRepository;
    private final ApplicationAssetRepository applicationAssetRepository;
    private final CertificateService certificateService;
    private final SecretService secretService;
    private final AuditService auditService;

    public Page<ApplicationResponse> findAll(String search, Pageable pageable) {
        Page<Application> page = (search == null || search.isBlank())
                ? applicationRepository.findAll(pageable)
                : applicationRepository.search(search, pageable);
        return page.map(this::toResponse);
    }

    public ApplicationResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    public ApplicationResponse create(ApplicationRequest request) {
        if (applicationRepository.existsByCode(request.code())) {
            throw new BadRequestException("An application with code '" + request.code() + "' already exists");
        }
        Application app = Application.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .area(request.area())
                .team(resolveTeam(request.teamId()))
                .owner(request.owner())
                .ownerEmail(request.ownerEmail())
                .criticality(request.criticality() == null ? "MEDIUM" : request.criticality())
                .status(request.status() == null ? "ACTIVE" : request.status())
                .build();
        app = applicationRepository.save(app);
        auditService.logCreate("Application", app.getId());
        return toResponse(app);
    }

    public ApplicationResponse update(Long id, ApplicationRequest request) {
        Application app = getEntity(id);
        auditService.logFieldChange("Application", id, "name", app.getName(), request.name());
        auditService.logFieldChange("Application", id, "owner", app.getOwner(), request.owner());
        auditService.logFieldChange("Application", id, "criticality", app.getCriticality(), request.criticality());
        auditService.logFieldChange("Application", id, "status", app.getStatus(), request.status());

        app.setName(request.name());
        app.setDescription(request.description());
        app.setArea(request.area());
        app.setTeam(resolveTeam(request.teamId()));
        app.setOwner(request.owner());
        app.setOwnerEmail(request.ownerEmail());
        if (request.criticality() != null) app.setCriticality(request.criticality());
        if (request.status() != null) app.setStatus(request.status());
        return toResponse(applicationRepository.save(app));
    }

    public void delete(Long id) {
        Application app = getEntity(id);
        applicationRepository.delete(app);
        auditService.logDelete("Application", id);
    }

    public ApplicationAssetsResponse findAssets(Long applicationId) {
        Application app = getEntity(applicationId);

        Map<Long, List<CertificateResponse>> certsByEnv = new LinkedHashMap<>();
        Map<Long, List<SecretResponse>> secretsByEnv = new LinkedHashMap<>();
        Map<Long, Environment> environmentsUsed = new LinkedHashMap<>();

        for (var link : applicationAssetRepository.findByApplicationId(applicationId)) {
            if (link.getAssetType() == AssetCategory.CERTIFICATE) {
                CertificateResponse cert = certificateService.findById(link.getAssetId());
                certsByEnv.computeIfAbsent(cert.environmentId(), k -> new ArrayList<>()).add(cert);
                environmentsUsed.putIfAbsent(cert.environmentId(), environmentRepository.getReferenceById(cert.environmentId()));
            } else {
                SecretResponse secret = secretService.findById(link.getAssetId());
                secretsByEnv.computeIfAbsent(secret.environmentId(), k -> new ArrayList<>()).add(secret);
                environmentsUsed.putIfAbsent(secret.environmentId(), environmentRepository.getReferenceById(secret.environmentId()));
            }
        }

        List<EnvironmentAssets> environments = environmentRepository.findAllByOrderBySortOrderAsc().stream()
                .filter(e -> environmentsUsed.containsKey(e.getId()))
                .map(e -> new EnvironmentAssets(e.getId(), e.getName(),
                        certsByEnv.getOrDefault(e.getId(), List.of()),
                        secretsByEnv.getOrDefault(e.getId(), List.of())))
                .toList();

        return new ApplicationAssetsResponse(app.getId(), app.getName(), environments);
    }

    Application getEntity(Long id) {
        return applicationRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Application", id));
    }

    private Team resolveTeam(Long teamId) {
        if (teamId == null) return null;
        return teamRepository.findById(teamId).orElseThrow(() -> ResourceNotFoundException.of("Team", teamId));
    }

    private ApplicationResponse toResponse(Application a) {
        return new ApplicationResponse(a.getId(), a.getName(), a.getCode(), a.getDescription(), a.getArea(),
                a.getTeam() == null ? null : a.getTeam().getId(),
                a.getTeam() == null ? null : a.getTeam().getName(),
                a.getOwner(), a.getOwnerEmail(), a.getCriticality(), a.getStatus(),
                a.getCreatedAt(), a.getUpdatedAt());
    }
}
