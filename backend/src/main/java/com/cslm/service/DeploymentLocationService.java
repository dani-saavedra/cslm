package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.DeploymentLocation;
import com.cslm.domain.LocationType;
import com.cslm.dto.DeploymentLocationDtos.DeploymentLocationRequest;
import com.cslm.dto.DeploymentLocationDtos.DeploymentLocationResponse;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.DeploymentLocationRepository;
import com.cslm.repository.LocationTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DeploymentLocationService {

    private final DeploymentLocationRepository deploymentLocationRepository;
    private final LocationTypeRepository locationTypeRepository;
    private final AuditService auditService;

    public List<DeploymentLocationResponse> findAll() {
        return deploymentLocationRepository.findAll().stream().map(this::toResponse).toList();
    }

    public DeploymentLocationResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    public DeploymentLocationResponse create(DeploymentLocationRequest request) {
        LocationType type = locationTypeRepository.findById(request.locationTypeId())
                .orElseThrow(() -> ResourceNotFoundException.of("LocationType", request.locationTypeId()));
        DeploymentLocation loc = DeploymentLocation.builder()
                .name(request.name())
                .locationType(type)
                .cluster(request.cluster())
                .namespace(request.namespace())
                .description(request.description())
                .active(request.active() == null || request.active())
                .build();
        loc = deploymentLocationRepository.save(loc);
        auditService.logCreate("DeploymentLocation", loc.getId());
        return toResponse(loc);
    }

    public DeploymentLocationResponse update(Long id, DeploymentLocationRequest request) {
        DeploymentLocation loc = getEntity(id);
        LocationType type = locationTypeRepository.findById(request.locationTypeId())
                .orElseThrow(() -> ResourceNotFoundException.of("LocationType", request.locationTypeId()));
        auditService.logFieldChange("DeploymentLocation", id, "name", loc.getName(), request.name());
        loc.setName(request.name());
        loc.setLocationType(type);
        loc.setCluster(request.cluster());
        loc.setNamespace(request.namespace());
        loc.setDescription(request.description());
        if (request.active() != null) loc.setActive(request.active());
        return toResponse(deploymentLocationRepository.save(loc));
    }

    public void delete(Long id) {
        DeploymentLocation loc = getEntity(id);
        deploymentLocationRepository.delete(loc);
        auditService.logDelete("DeploymentLocation", id);
    }

    private DeploymentLocation getEntity(Long id) {
        return deploymentLocationRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("DeploymentLocation", id));
    }

    private DeploymentLocationResponse toResponse(DeploymentLocation l) {
        return new DeploymentLocationResponse(l.getId(), l.getName(), l.getLocationType().getId(),
                l.getLocationType().getName(), l.getCluster(), l.getNamespace(), l.getDescription(),
                l.getActive(), l.getCreatedAt(), l.getUpdatedAt());
    }
}
