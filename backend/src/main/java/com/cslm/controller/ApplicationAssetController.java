package com.cslm.controller;

import com.cslm.dto.ApplicationAssetDtos.LinkAssetRequest;
import com.cslm.service.ApplicationAssetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/application-assets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
public class ApplicationAssetController {

    private final ApplicationAssetService applicationAssetService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void link(@Valid @RequestBody LinkAssetRequest request) {
        applicationAssetService.link(request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlink(@RequestParam Long applicationId, @RequestParam String assetType, @RequestParam Long assetId) {
        applicationAssetService.unlink(applicationId, assetType, assetId);
    }
}
