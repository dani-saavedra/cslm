package com.cslm.repository;

import com.cslm.domain.AssetCategory;
import com.cslm.domain.AssetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssetTypeRepository extends JpaRepository<AssetType, Long> {
    List<AssetType> findByCategory(AssetCategory category);
    List<AssetType> findByCategoryAndActiveTrue(AssetCategory category);
}
