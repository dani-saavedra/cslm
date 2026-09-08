package com.cslm.controller;

import com.cslm.domain.AssetCategory;
import com.cslm.dto.CatalogDtos.*;
import com.cslm.service.CatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/api/admin/asset-types")
    public List<AssetTypeResponse> findAssetTypes(@RequestParam(required = false) AssetCategory category) {
        return catalogService.findAssetTypes(category);
    }

    @PostMapping("/api/admin/asset-types")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public AssetTypeResponse createAssetType(@Valid @RequestBody AssetTypeRequest request) {
        return catalogService.createAssetType(request);
    }

    @PutMapping("/api/admin/asset-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AssetTypeResponse updateAssetType(@PathVariable Long id, @Valid @RequestBody AssetTypeRequest request) {
        return catalogService.updateAssetType(id, request);
    }

    @DeleteMapping("/api/admin/asset-types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAssetType(@PathVariable Long id) {
        catalogService.deleteAssetType(id);
    }

    @GetMapping("/api/admin/location-types")
    public List<LocationTypeResponse> findLocationTypes() {
        return catalogService.findLocationTypes();
    }

    @PostMapping("/api/admin/location-types")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public LocationTypeResponse createLocationType(@Valid @RequestBody LocationTypeRequest request) {
        return catalogService.createLocationType(request);
    }

    @PutMapping("/api/admin/location-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public LocationTypeResponse updateLocationType(@PathVariable Long id, @Valid @RequestBody LocationTypeRequest request) {
        return catalogService.updateLocationType(id, request);
    }

    @DeleteMapping("/api/admin/location-types/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteLocationType(@PathVariable Long id) {
        catalogService.deleteLocationType(id);
    }
}
