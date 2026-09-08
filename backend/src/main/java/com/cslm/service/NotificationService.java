package com.cslm.service;

import com.cslm.domain.*;
import com.cslm.repository.NotificationHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;
    private final NotificationHistoryRepository notificationHistoryRepository;
    private final SemaphoreService semaphoreService;

    @Value("${cslm.mail.from}")
    private String fromAddress;

    /**
     * Sends the expiration notification for a certificate or secret and records the outcome
     * in notification_history, regardless of success/failure.
     */
    public NotificationHistory sendExpirationNotification(AssetCategory assetType, Long assetId, String assetName,
                                                            String applicationNames, String environmentName,
                                                            String owner, String recipient,
                                                            LocalDate expirationDate, String location,
                                                            NotificationRule rule) {
        long daysRemaining = semaphoreService.daysRemaining(expirationDate);
        SemaphoreStatus status = semaphoreService.statusFor(expirationDate);

        String subject = buildSubject(assetType, assetName, daysRemaining);
        String body = buildBody(assetType, assetName, applicationNames, environmentName, owner,
                expirationDate, daysRemaining, status, location);

        NotificationHistory.NotificationHistoryBuilder historyBuilder = NotificationHistory.builder()
                .assetType(assetType)
                .assetId(assetId)
                .rule(rule)
                .recipient(recipient)
                .subject(subject)
                .body(body)
                .sentAt(LocalDateTime.now());

        try {
            if (recipient == null || recipient.isBlank()) {
                throw new IllegalArgumentException("No recipient email configured for this asset");
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            historyBuilder.status("SENT");
        } catch (Exception e) {
            log.warn("Failed to send notification for {} #{}: {}", assetType, assetId, e.getMessage());
            historyBuilder.status("FAILED").errorMessage(e.getMessage());
        }

        return notificationHistoryRepository.save(historyBuilder.build());
    }

    public boolean alreadyNotifiedToday(AssetCategory assetType, Long assetId, Long ruleId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return notificationHistoryRepository.existsByAssetTypeAndAssetIdAndRuleIdAndSentAtBetween(
                assetType, assetId, ruleId, startOfDay, endOfDay);
    }

    private String buildSubject(AssetCategory type, String name, long daysRemaining) {
        String kind = type == AssetCategory.CERTIFICATE ? "Certificate" : "Secret";
        if (daysRemaining < 0) {
            return "[CSLM] " + kind + " EXPIRED: " + name;
        }
        return "[CSLM] " + kind + " expiring in " + daysRemaining + " day(s): " + name;
    }

    private String buildBody(AssetCategory type, String name, String applicationNames, String environmentName,
                              String owner, LocalDate expirationDate, long daysRemaining, SemaphoreStatus status,
                              String location) {
        String kind = type == AssetCategory.CERTIFICATE ? "Certificate" : "Secret";
        String action = daysRemaining < 0
                ? "This asset has already expired. Renew or rotate it immediately and update its record in CSLM."
                : "Please plan the renewal/rotation of this asset before it expires.";

        return """
                CSLM - %s Expiration Notice

                Name: %s
                Type: %s
                Application(s): %s
                Environment: %s
                Owner: %s
                Location: %s
                Expiration date: %s
                Days remaining: %d
                Status: %s

                Recommended action: %s

                This is an automated message from the Certificate & Secret Lifecycle Manager (CSLM).
                """.formatted(kind, name, kind, applicationNames, environmentName, owner,
                location == null ? "N/A" : location, expirationDate, daysRemaining, status, action);
    }
}
