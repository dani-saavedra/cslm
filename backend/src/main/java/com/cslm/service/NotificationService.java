package com.cslm.service;

import com.cslm.domain.*;
import com.cslm.repository.NotificationHistoryRepository;
import com.cslm.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final String NO_RECIPIENT_PLACEHOLDER = "(no recipient configured)";

    private final JavaMailSender mailSender;
    private final NotificationHistoryRepository notificationHistoryRepository;
    private final UserRepository userRepository;
    private final SemaphoreService semaphoreService;

    @Value("${cslm.mail.from}")
    private String fromAddress;

    /**
     * Sends the expiration notification for a certificate or secret to its configured contact
     * email and to every active user belonging to its responsible team, recording the outcome
     * of each send in notification_history, regardless of success/failure.
     */
    public List<NotificationHistory> sendExpirationNotification(AssetCategory assetType, Long assetId, String assetName,
                                                                  String applicationNames, String environmentName,
                                                                  String owner, Team team, String contactEmail,
                                                                  LocalDate expirationDate, String location,
                                                                  NotificationRule rule) {
        long daysRemaining = semaphoreService.daysRemaining(expirationDate);
        SemaphoreStatus status = semaphoreService.statusFor(expirationDate);

        String subject = buildSubject(assetType, assetName, daysRemaining);
        String body = buildBody(assetType, assetName, applicationNames, environmentName, owner,
                expirationDate, daysRemaining, status, location);

        Set<String> recipients = resolveRecipients(team, contactEmail);
        if (recipients.isEmpty()) {
            recipients = Set.of(NO_RECIPIENT_PLACEHOLDER);
        }

        List<NotificationHistory> histories = new ArrayList<>();
        for (String recipient : recipients) {
            NotificationHistory.NotificationHistoryBuilder historyBuilder = NotificationHistory.builder()
                    .assetType(assetType)
                    .assetId(assetId)
                    .rule(rule)
                    .recipient(recipient)
                    .subject(subject)
                    .body(body)
                    .sentAt(LocalDateTime.now());

            try {
                if (recipient.equals(NO_RECIPIENT_PLACEHOLDER)) {
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
                log.warn("Failed to send notification for {} #{} to {}: {}", assetType, assetId, recipient, e.getMessage());
                historyBuilder.status("FAILED").errorMessage(e.getMessage());
            }

            histories.add(notificationHistoryRepository.save(historyBuilder.build()));
        }
        return histories;
    }

    /**
     * Union of the asset's direct contact email and the emails of every active user
     * belonging to its responsible team, so a team-addressed notification reaches all its members.
     */
    private Set<String> resolveRecipients(Team team, String contactEmail) {
        Set<String> recipients = new LinkedHashSet<>();
        if (contactEmail != null && !contactEmail.isBlank()) {
            recipients.add(contactEmail.trim());
        }
        if (team != null) {
            userRepository.findByTeams_IdAndActiveTrue(team.getId()).forEach(user -> {
                String email = user.getEmail();
                if (email != null && !email.isBlank()) {
                    recipients.add(email.trim());
                }
            });
        }
        return recipients;
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
