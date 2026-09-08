package com.cslm.repository;

import com.cslm.domain.Secret;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SecretRepository extends JpaRepository<Secret, Long> {

    @Query("select s from Secret s where " +
            "(:environmentId is null or s.environment.id = :environmentId) and " +
            "(:production is null or s.environment.production = :production) and " +
            "(:status is null or s.status = :status) and " +
            "(:typeId is null or s.secretType.id = :typeId) and " +
            "(:applicationId is null or s.id in (select aa.assetId from ApplicationAsset aa " +
            "   where aa.assetType = com.cslm.domain.AssetCategory.SECRET and aa.application.id = :applicationId)) and " +
            "(:search is null or lower(s.name) like lower(concat('%',:search,'%')) " +
            "   or lower(s.description) like lower(concat('%',:search,'%')) " +
            "   or lower(s.storageSystem) like lower(concat('%',:search,'%')) " +
            "   or lower(s.owner) like lower(concat('%',:search,'%')) " +
            "   or lower(s.contactEmail) like lower(concat('%',:search,'%')))")
    Page<Secret> search(@Param("environmentId") Long environmentId,
                         @Param("production") Boolean production,
                         @Param("status") String status,
                         @Param("typeId") Long typeId,
                         @Param("applicationId") Long applicationId,
                         @Param("search") String search,
                         Pageable pageable);

    @Query("select s.id from Secret s where s.id in (select aa.assetId from ApplicationAsset aa " +
            "where aa.assetType = com.cslm.domain.AssetCategory.SECRET and aa.application.id = :applicationId)")
    List<Long> findIdsByApplicationId(@Param("applicationId") Long applicationId);

    List<Secret> findByExpirationDateBetween(LocalDate from, LocalDate to);

    List<Secret> findByExpirationDateLessThan(LocalDate date);

    long countByExpirationDateBetween(LocalDate from, LocalDate to);

    long countByExpirationDateLessThan(LocalDate date);
}
