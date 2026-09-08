package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.AssetCategory;
import com.cslm.domain.AssetType;
import com.cslm.domain.LocationType;
import com.cslm.dto.CatalogDtos.*;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.AssetTypeRepository;
import com.cslm.repository.LocationTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CatalogService {

    private final AssetTypeRepository assetTypeRepository;
    private final LocationTypeRepository locationTypeRepository;
    private final AuditService auditService;

    // ---- Asset types (certificate/secret types) ----

    public List<AssetTypeResponse> findAssetTypes(AssetCategory category) {
        List<AssetType> types = category == null ? assetTypeRepository.findAll() : assetTypeRepository.findByCategory(category);
        return types.stream().map(this::toResponse).toList();
    }

    public AssetTypeResponse createAssetType(AssetTypeRequest request) {
        AssetType type = AssetType.builder()
                .category(AssetCategory.valueOf(request.category().toUpperCase()))
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .active(request.active() == null || request.active())
                .build();
        type = assetTypeRepository.save(type);
        auditService.logCreate("AssetType", type.getId());
        return toResponse(type);
    }

    public AssetTypeResponse updateAssetType(Long id, AssetTypeRequest request) {
        AssetType type = assetTypeRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("AssetType", id));
        type.setCategory(AssetCategory.valueOf(request.category().toUpperCase()));
        type.setCode(request.code());
        type.setName(request.name());
        type.setDescription(request.description());
        if (request.active() != null) type.setActive(request.active());
        auditService.logFieldChange("AssetType", id, "name", type.getName(), request.name());
        return toResponse(assetTypeRepository.save(type));
    }

    public void deleteAssetType(Long id) {
        assetTypeRepository.deleteById(id);
        auditService.logDelete("AssetType", id);
    }

    private AssetTypeResponse toResponse(AssetType t) {
        return new AssetTypeResponse(t.getId(), t.getCategory().name(), t.getCode(), t.getName(), t.getDescription(), t.getActive());
    }

    // ---- Location types ----

    public List<LocationTypeResponse> findLocationTypes() {
        return locationTypeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public LocationTypeResponse createLocationType(LocationTypeRequest request) {
        LocationType type = LocationType.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .active(request.active() == null || request.active())
                .build();
        type = locationTypeRepository.save(type);
        auditService.logCreate("LocationType", type.getId());
        return toResponse(type);
    }

    public LocationTypeResponse updateLocationType(Long id, LocationTypeRequest request) {
        LocationType type = locationTypeRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("LocationType", id));
        type.setCode(request.code());
        type.setName(request.name());
        type.setDescription(request.description());
        if (request.active() != null) type.setActive(request.active());
        auditService.logFieldChange("LocationType", id, "name", type.getName(), request.name());
        return toResponse(locationTypeRepository.save(type));
    }

    public void deleteLocationType(Long id) {
        locationTypeRepository.deleteById(id);
        auditService.logDelete("LocationType", id);
    }

    private LocationTypeResponse toResponse(LocationType t) {
        return new LocationTypeResponse(t.getId(), t.getCode(), t.getName(), t.getDescription(), t.getActive());
    }
}
