package com.cslm.repository;

import com.cslm.domain.AssetCategory;
import com.cslm.domain.NotificationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface NotificationHistoryRepository extends JpaRepository<NotificationHistory, Long> {

    boolean existsByAssetTypeAndAssetIdAndRuleIdAndSentAtBetween(
            AssetCategory assetType, Long assetId, Long ruleId, LocalDateTime from, LocalDateTime to);

    Page<NotificationHistory> findAllByOrderBySentAtDesc(Pageable pageable);
}
