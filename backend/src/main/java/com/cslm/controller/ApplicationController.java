package com.cslm.controller;

import com.cslm.dto.ApplicationAssetsResponse;
import com.cslm.dto.ApplicationDtos.ApplicationRequest;
import com.cslm.dto.ApplicationDtos.ApplicationResponse;
import com.cslm.dto.GraphDtos.GraphResponse;
import com.cslm.service.ApplicationService;
import com.cslm.service.GraphService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final GraphService graphService;

    @GetMapping
    public Page<ApplicationResponse> findAll(@RequestParam(required = false) String search, Pageable pageable) {
        return applicationService.findAll(search, pageable);
    }

    @GetMapping("/{id}")
    public ApplicationResponse findById(@PathVariable Long id) {
        return applicationService.findById(id);
    }

    @GetMapping("/{id}/assets")
    public ApplicationAssetsResponse assets(@PathVariable Long id) {
        return applicationService.findAssets(id);
    }

    @GetMapping("/{id}/graph")
    public GraphResponse graph(@PathVariable Long id) {
        return graphService.applicationGraph(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ApplicationResponse create(@Valid @RequestBody ApplicationRequest request) {
        return applicationService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public ApplicationResponse update(@PathVariable Long id, @Valid @RequestBody ApplicationRequest request) {
        return applicationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        applicationService.delete(id);
    }
}
