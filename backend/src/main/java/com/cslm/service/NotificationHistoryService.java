package com.cslm.service;

import com.cslm.domain.*;
import com.cslm.dto.NotificationDtos.NotificationHistoryResponse;
import com.cslm.dto.NotificationDtos.TestNotificationRequest;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.ApplicationAssetRepository;
import com.cslm.repository.AssetDeploymentRepository;
import com.cslm.repository.CertificateRepository;
import com.cslm.repository.NotificationHistoryRepository;
import com.cslm.repository.SecretRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationHistoryService {

    private final NotificationHistoryRepository notificationHistoryRepository;
    private final CertificateRepository certificateRepository;
    private final SecretRepository secretRepository;
    private final ApplicationAssetRepository applicationAssetRepository;
    private final AssetDeploymentRepository assetDeploymentRepository;
    private final NotificationService notificationService;

    public Page<NotificationHistoryResponse> findAll(Pageable pageable) {
        return notificationHistoryRepository.findAllByOrderBySentAtDesc(pageable).map(this::toResponse);
    }

    public NotificationHistoryResponse sendTest(TestNotificationRequest request) {
        AssetCategory type = AssetCategory.valueOf(request.assetType().toUpperCase());
        NotificationHistory history;
        if (type == AssetCategory.CERTIFICATE) {
            Certificate cert = certificateRepository.findById(request.assetId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Certificate", request.assetId()));
            history = notificationService.sendExpirationNotification(type, cert.getId(), cert.getName(),
                    applicationNames(type, cert.getId()), cert.getEnvironment().getName(), cert.getOwner(),
                    cert.getContactEmail(), cert.getExpirationDate(), locationSummary(type, cert.getId()), null);
        } else {
            Secret secret = secretRepository.findById(request.assetId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Secret", request.assetId()));
            history = notificationService.sendExpirationNotification(type, secret.getId(), secret.getName(),
                    applicationNames(type, secret.getId()), secret.getEnvironment().getName(), secret.getOwner(),
                    secret.getContactEmail(), secret.getExpirationDate(), locationSummary(type, secret.getId()), null);
        }
        return toResponse(history);
    }

    private String applicationNames(AssetCategory type, Long assetId) {
        return applicationAssetRepository.findByAssetTypeAndAssetId(type, assetId).stream()
                .map(aa -> aa.getApplication().getName()).distinct().collect(Collectors.joining(", "));
    }

    private String locationSummary(AssetCategory type, Long assetId) {
        return assetDeploymentRepository.findByAssetTypeAndAssetId(type, assetId).stream()
                .map(d -> d.getDeploymentLocation().getName())
                .distinct()
                .collect(Collectors.joining(", "));
    }

    private NotificationHistoryResponse toResponse(NotificationHistory h) {
        String assetName = h.getAssetType() == AssetCategory.CERTIFICATE
                ? certificateRepository.findById(h.getAssetId()).map(Certificate::getName).orElse("(deleted)")
                : secretRepository.findById(h.getAssetId()).map(Secret::getName).orElse("(deleted)");
        return new NotificationHistoryResponse(h.getId(), h.getAssetType().name(), h.getAssetId(), assetName,
                h.getRule() == null ? null : h.getRule().getId(), h.getRule() == null ? "Manual test" : h.getRule().getName(),
                h.getRecipient(), h.getSubject(), h.getStatus(), h.getErrorMessage(), h.getSentAt());
    }
}
