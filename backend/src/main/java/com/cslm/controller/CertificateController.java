package com.cslm.controller;

import com.cslm.dto.CertificateDtos.CertificateFileResponse;
import com.cslm.dto.CertificateDtos.CertificateParseResponse;
import com.cslm.dto.CertificateDtos.CertificateRequest;
import com.cslm.dto.CertificateDtos.CertificateResponse;
import com.cslm.dto.GraphDtos.GraphResponse;
import com.cslm.service.CertificateParsingService;
import com.cslm.service.CertificateService;
import com.cslm.service.GraphService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;
    private final GraphService graphService;
    private final CertificateParsingService certificateParsingService;

    @GetMapping
    public Page<CertificateResponse> search(
            @RequestParam(required = false) Long environmentId,
            @RequestParam(required = false) Boolean production,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) Long applicationId,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return certificateService.search(environmentId, production, status, typeId, applicationId, search, pageable);
    }

    @GetMapping("/{id}")
    public CertificateResponse findById(@PathVariable Long id) {
        return certificateService.findById(id);
    }

    @GetMapping("/{id}/dependencies")
    public GraphResponse dependencies(@PathVariable Long id) {
        return graphService.certificateDependencies(id);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long id) {
        CertificateFileResponse file = certificateService.getFile(id);
        byte[] content = file.pem().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("application/x-x509-ca-cert"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.fileName()).build().toString())
                .body(content);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public CertificateResponse create(@Valid @RequestBody CertificateRequest request) {
        return certificateService.create(request);
    }

    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public CertificateParseResponse parse(@RequestParam("file") MultipartFile file) {
        return certificateParsingService.parse(file);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','OPERATOR')")
    public CertificateResponse update(@PathVariable Long id, @Valid @RequestBody CertificateRequest request) {
        return certificateService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        certificateService.delete(id);
    }
}
