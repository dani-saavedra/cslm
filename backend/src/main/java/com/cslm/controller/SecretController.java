package com.cslm.controller;

import com.cslm.dto.GraphDtos.GraphResponse;
import com.cslm.dto.SecretDtos.SecretRequest;
import com.cslm.dto.SecretDtos.SecretResponse;
import com.cslm.service.GraphService;
import com.cslm.service.SecretService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/secrets")
@RequiredArgsConstructor
public class SecretController {

    private final SecretService secretService;
    private final GraphService graphService;

    @GetMapping
    public Page<SecretResponse> search(
            @RequestParam(required = false) Long environmentId,
            @RequestParam(required = false) Boolean production,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) Long applicationId,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return secretService.search(environmentId, production, status, typeId, applicationId, search, pageable);
    }

    @GetMapping("/{id}")
    public SecretResponse findById(@PathVariable Long id) {
        return secretService.findById(id);
    }

    @GetMapping("/{id}/dependencies")
    public GraphResponse dependencies(@PathVariable Long id) {
        return graphService.secretDependencies(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public SecretResponse create(@Valid @RequestBody SecretRequest request) {
        return secretService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public SecretResponse update(@PathVariable Long id, @Valid @RequestBody SecretRequest request) {
        return secretService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        secretService.delete(id);
    }
}
