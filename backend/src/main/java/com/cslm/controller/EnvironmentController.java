package com.cslm.controller;

import com.cslm.dto.EnvironmentDtos.EnvironmentRequest;
import com.cslm.dto.EnvironmentDtos.EnvironmentResponse;
import com.cslm.service.EnvironmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/environments")
@RequiredArgsConstructor
public class EnvironmentController {

    private final EnvironmentService environmentService;

    @GetMapping
    public List<EnvironmentResponse> findAll(@RequestParam(defaultValue = "false") boolean onlyActive) {
        return environmentService.findAll(onlyActive);
    }

    @GetMapping("/{id}")
    public EnvironmentResponse findById(@PathVariable Long id) {
        return environmentService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public EnvironmentResponse create(@Valid @RequestBody EnvironmentRequest request) {
        return environmentService.create(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EnvironmentResponse update(@PathVariable Long id, @Valid @RequestBody EnvironmentRequest request) {
        return environmentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        environmentService.delete(id);
    }
}
