package com.cslm.service;

import com.cslm.domain.AssetCategory;
import com.cslm.domain.Certificate;
import com.cslm.domain.Secret;
import com.cslm.domain.SemaphoreStatus;
import com.cslm.dto.DashboardDtos.DashboardSummaryResponse;
import com.cslm.dto.DashboardDtos.ExpiringAssetResponse;
import com.cslm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final CertificateRepository certificateRepository;
    private final SecretRepository secretRepository;
    private final ApplicationRepository applicationRepository;
    private final EnvironmentRepository environmentRepository;
    private final ApplicationAssetRepository applicationAssetRepository;
    private final SemaphoreService semaphoreService;

    public DashboardSummaryResponse summary() {
        LocalDate today = LocalDate.now();
        LocalDate horizon = today.plusDays(semaphoreService.yellowMaxDays());

        long certExpiringSoon = certificateRepository.countByExpirationDateBetween(today, horizon);
        long secretExpiringSoon = secretRepository.countByExpirationDateBetween(today, horizon);
        long certExpired = certificateRepository.countByExpirationDateLessThan(today);
        long secretExpired = secretRepository.countByExpirationDateLessThan(today);

        Map<SemaphoreStatus, Long> counts = new EnumMap<>(SemaphoreStatus.class);
        for (SemaphoreStatus s : SemaphoreStatus.values()) {
            counts.put(s, 0L);
        }
        for (Certificate c : certificateRepository.findAll()) {
            counts.merge(semaphoreService.statusFor(c.getExpirationDate()), 1L, Long::sum);
        }
        for (Secret s : secretRepository.findAll()) {
            counts.merge(semaphoreService.statusFor(s.getExpirationDate()), 1L, Long::sum);
        }
        Map<String, Long> semaphoreCounts = counts.entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey().name(), Map.Entry::getValue));

        return new DashboardSummaryResponse(
                certificateRepository.count(), secretRepository.count(),
                applicationRepository.count(), environmentRepository.count(),
                certExpiringSoon, secretExpiringSoon, certExpired, secretExpired,
                semaphoreCounts
        );
    }

    public List<ExpiringAssetResponse> expiring(Integer withinDays) {
        LocalDate today = LocalDate.now();
        long horizonDays = withinDays != null ? withinDays : semaphoreService.yellowMaxDays();
        LocalDate horizon = today.plusDays(horizonDays);

        List<ExpiringAssetResponse> result = new ArrayList<>();

        for (Certificate c : certificateRepository.findByExpirationDateBetween(today.minusYears(50), horizon)) {
            result.add(toExpiringAsset(AssetCategory.CERTIFICATE, c.getId(), c.getName(), c.getEnvironment().getName(),
                    c.getOwner(), c.getExpirationDate()));
        }
        for (Secret s : secretRepository.findByExpirationDateBetween(today.minusYears(50), horizon)) {
            result.add(toExpiringAsset(AssetCategory.SECRET, s.getId(), s.getName(), s.getEnvironment().getName(),
                    s.getOwner(), s.getExpirationDate()));
        }
        return result.stream()
                .sorted((a, b) -> a.daysRemaining().compareTo(b.daysRemaining()))
                .toList();
    }

    private ExpiringAssetResponse toExpiringAsset(AssetCategory type, Long id, String name, String environmentName,
                                                   String owner, LocalDate expirationDate) {
        String applicationNames = applicationAssetRepository.findByAssetTypeAndAssetId(type, id).stream()
                .map(aa -> aa.getApplication().getName())
                .distinct()
                .collect(Collectors.joining(", "));
        return new ExpiringAssetResponse(type.name(), id, name, applicationNames, environmentName, owner,
                expirationDate, semaphoreService.daysRemaining(expirationDate), semaphoreService.statusFor(expirationDate).name());
    }
}
