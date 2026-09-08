package com.cslm.scheduler;

import com.cslm.domain.*;
import com.cslm.repository.ApplicationAssetRepository;
import com.cslm.repository.AssetDeploymentRepository;
import com.cslm.repository.CertificateRepository;
import com.cslm.repository.NotificationRuleRepository;
import com.cslm.repository.SecretRepository;
import com.cslm.service.NotificationService;
import com.cslm.service.SemaphoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Daily job: finds certificates/secrets matching an enabled notification rule's
 * "days before expiration" threshold and sends the corresponding email, once per
 * (asset, rule, day) to avoid duplicate sends. Designed to run under Spring Scheduler
 * for now; the per-asset check is idempotent so it can later run as a distributed job
 * (e.g. one shard per asset range) without behavior changes.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ExpirationNotificationJob {

    private final CertificateRepository certificateRepository;
    private final SecretRepository secretRepository;
    private final NotificationRuleRepository notificationRuleRepository;
    private final ApplicationAssetRepository applicationAssetRepository;
    private final AssetDeploymentRepository assetDeploymentRepository;
    private final NotificationService notificationService;
    private final SemaphoreService semaphoreService;

    @Value("${cslm.notifications.enabled:true}")
    private boolean notificationsEnabled;

    @Scheduled(cron = "${cslm.notifications.cron:0 0 7 * * *}")
    @Transactional
    public void run() {
        if (!notificationsEnabled) {
            log.info("Expiration notification job is disabled (cslm.notifications.enabled=false)");
            return;
        }
        List<NotificationRule> rules = notificationRuleRepository.findByEnabledTrue();
        if (rules.isEmpty()) {
            return;
        }

        int sent = 0;
        for (Certificate cert : certificateRepository.findAll()) {
            sent += processAsset(rules, "CERTIFICATE", AssetCategory.CERTIFICATE, cert.getId(), cert.getName(),
                    cert.getExpirationDate(), cert.getEnvironment().getName(), cert.getOwner(), cert.getContactEmail());
        }
        for (Secret secret : secretRepository.findAll()) {
            if (secret.getExpirationDate() == null) {
                continue;
            }
            sent += processAsset(rules, "SECRET", AssetCategory.SECRET, secret.getId(), secret.getName(),
                    secret.getExpirationDate(), secret.getEnvironment().getName(), secret.getOwner(), secret.getContactEmail());
        }
        log.info("Expiration notification job finished: {} email(s) sent", sent);
    }

    private int processAsset(List<NotificationRule> rules, String category, AssetCategory assetType, Long assetId,
                              String name, java.time.LocalDate expirationDate, String environmentName, String owner,
                              String contactEmail) {
        if (expirationDate == null) {
            return 0;
        }
        long daysRemaining = semaphoreService.daysRemaining(expirationDate);
        int sent = 0;
        for (NotificationRule rule : rules) {
            boolean applies = "ALL".equals(rule.getAssetCategory()) || rule.getAssetCategory().equals(category);
            if (!applies || daysRemaining != rule.getDaysBefore()) {
                continue;
            }
            if (notificationService.alreadyNotifiedToday(assetType, assetId, rule.getId())) {
                continue;
            }
            String applicationNames = applicationAssetRepository.findByAssetTypeAndAssetId(assetType, assetId).stream()
                    .map(aa -> aa.getApplication().getName()).distinct().collect(Collectors.joining(", "));
            String location = assetDeploymentRepository.findByAssetTypeAndAssetId(assetType, assetId).stream()
                    .map(d -> d.getDeploymentLocation().getName()).distinct().collect(Collectors.joining(", "));

            notificationService.sendExpirationNotification(assetType, assetId, name, applicationNames,
                    environmentName, owner, contactEmail, expirationDate, location, rule);
            sent++;
        }
        return sent;
    }
}
