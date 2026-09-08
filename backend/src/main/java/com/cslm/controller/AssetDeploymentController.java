package com.cslm.controller;

import com.cslm.domain.AssetCategory;
import com.cslm.dto.AssetDeploymentDtos.AssetDeploymentRequest;
import com.cslm.dto.CommonDtos.DeploymentSummary;
import com.cslm.service.AssetDeploymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/asset-deployments")
@RequiredArgsConstructor
public class AssetDeploymentController {

    private final AssetDeploymentService assetDeploymentService;

    @GetMapping
    public List<DeploymentSummary> findForAsset(@RequestParam String assetType, @RequestParam Long assetId) {
        return assetDeploymentService.findForAsset(AssetCategory.valueOf(assetType.toUpperCase()), assetId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public DeploymentSummary create(@Valid @RequestBody AssetDeploymentRequest request) {
        return assetDeploymentService.create(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public void delete(@PathVariable Long id) {
        assetDeploymentService.delete(id);
    }
}
