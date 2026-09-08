package com.cslm.repository;

import com.cslm.domain.ApplicationAsset;
import com.cslm.domain.AssetCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationAssetRepository extends JpaRepository<ApplicationAsset, Long> {
    List<ApplicationAsset> findByApplicationId(Long applicationId);
    List<ApplicationAsset> findByAssetTypeAndAssetId(AssetCategory assetType, Long assetId);
    Optional<ApplicationAsset> findByApplicationIdAndAssetTypeAndAssetId(Long applicationId, AssetCategory assetType, Long assetId);
    boolean existsByApplicationIdAndAssetTypeAndAssetId(Long applicationId, AssetCategory assetType, Long assetId);
    void deleteByAssetTypeAndAssetId(AssetCategory assetType, Long assetId);
}
