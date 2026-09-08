package com.cslm.repository;

import com.cslm.domain.AssetCategory;
import com.cslm.domain.AssetDeployment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetDeploymentRepository extends JpaRepository<AssetDeployment, Long> {
    List<AssetDeployment> findByAssetTypeAndAssetId(AssetCategory assetType, Long assetId);
    List<AssetDeployment> findByApplicationId(Long applicationId);
    void deleteByAssetTypeAndAssetId(AssetCategory assetType, Long assetId);
}
