package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.Environment;
import com.cslm.dto.EnvironmentDtos.EnvironmentRequest;
import com.cslm.dto.EnvironmentDtos.EnvironmentResponse;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.EnvironmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EnvironmentService {

    private final EnvironmentRepository environmentRepository;
    private final AuditService auditService;

    public List<EnvironmentResponse> findAll(boolean onlyActive) {
        List<Environment> environments = onlyActive
                ? environmentRepository.findAllByActiveTrueOrderBySortOrderAsc()
                : environmentRepository.findAllByOrderBySortOrderAsc();
        return environments.stream().map(this::toResponse).toList();
    }

    public EnvironmentResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    public EnvironmentResponse create(EnvironmentRequest request) {
        Environment env = Environment.builder()
                .name(request.name())
                .code(request.code().toUpperCase())
                .description(request.description())
                .production(request.production() != null && request.production())
                .sortOrder(request.sortOrder() == null ? 0 : request.sortOrder())
                .active(request.active() == null || request.active())
                .build();
        env = environmentRepository.save(env);
        auditService.logCreate("Environment", env.getId());
        return toResponse(env);
    }

    public EnvironmentResponse update(Long id, EnvironmentRequest request) {
        Environment env = getEntity(id);
        auditService.logFieldChange("Environment", id, "name", env.getName(), request.name());
        auditService.logFieldChange("Environment", id, "active", env.getActive(), request.active());
        auditService.logFieldChange("Environment", id, "production", env.getProduction(), request.production());
        env.setName(request.name());
        env.setCode(request.code().toUpperCase());
        env.setDescription(request.description());
        if (request.production() != null) {
            env.setProduction(request.production());
        }
        if (request.sortOrder() != null) {
            env.setSortOrder(request.sortOrder());
        }
        if (request.active() != null) {
            env.setActive(request.active());
        }
        return toResponse(environmentRepository.save(env));
    }

    public void delete(Long id) {
        Environment env = getEntity(id);
        environmentRepository.delete(env);
        auditService.logDelete("Environment", id);
    }

    private Environment getEntity(Long id) {
        return environmentRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Environment", id));
    }

    private EnvironmentResponse toResponse(Environment e) {
        return new EnvironmentResponse(e.getId(), e.getName(), e.getCode(), e.getDescription(),
                e.getProduction(), e.getSortOrder(), e.getActive(), e.getCreatedAt(), e.getUpdatedAt());
    }
}
