package com.cslm.controller;

import com.cslm.dto.DeploymentLocationDtos.DeploymentLocationRequest;
import com.cslm.dto.DeploymentLocationDtos.DeploymentLocationResponse;
import com.cslm.service.DeploymentLocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deployment-locations")
@RequiredArgsConstructor
public class DeploymentLocationController {

    private final DeploymentLocationService deploymentLocationService;

    @GetMapping
    public List<DeploymentLocationResponse> findAll() {
        return deploymentLocationService.findAll();
    }

    @GetMapping("/{id}")
    public DeploymentLocationResponse findById(@PathVariable Long id) {
        return deploymentLocationService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public DeploymentLocationResponse create(@Valid @RequestBody DeploymentLocationRequest request) {
        return deploymentLocationService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public DeploymentLocationResponse update(@PathVariable Long id, @Valid @RequestBody DeploymentLocationRequest request) {
        return deploymentLocationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        deploymentLocationService.delete(id);
    }
}
