package com.cslm.repository;

import com.cslm.domain.Certificate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    @Query("select c from Certificate c where " +
            "(:environmentId is null or c.environment.id = :environmentId) and " +
            "(:production is null or c.environment.production = :production) and " +
            "(:status is null or c.status = :status) and " +
            "(:typeId is null or c.certificateType.id = :typeId) and " +
            "(:applicationId is null or c.id in (select aa.assetId from ApplicationAsset aa " +
            "   where aa.assetType = com.cslm.domain.AssetCategory.CERTIFICATE and aa.application.id = :applicationId)) and " +
            "(:search is null or lower(c.name) like lower(concat('%',:search,'%')) " +
            "   or lower(c.alias) like lower(concat('%',:search,'%')) " +
            "   or lower(c.commonName) like lower(concat('%',:search,'%')) " +
            "   or lower(c.subject) like lower(concat('%',:search,'%')) " +
            "   or lower(c.serialNumber) like lower(concat('%',:search,'%')) " +
            "   or lower(c.owner) like lower(concat('%',:search,'%')) " +
            "   or lower(c.contactEmail) like lower(concat('%',:search,'%')))")
    Page<Certificate> search(@Param("environmentId") Long environmentId,
                              @Param("production") Boolean production,
                              @Param("status") String status,
                              @Param("typeId") Long typeId,
                              @Param("applicationId") Long applicationId,
                              @Param("search") String search,
                              Pageable pageable);

    @Query("select c.id from Certificate c where c.id in (select aa.assetId from ApplicationAsset aa " +
            "where aa.assetType = com.cslm.domain.AssetCategory.CERTIFICATE and aa.application.id = :applicationId)")
    List<Long> findIdsByApplicationId(@Param("applicationId") Long applicationId);

    List<Certificate> findByExpirationDateBetween(LocalDate from, LocalDate to);

    List<Certificate> findByExpirationDateLessThan(LocalDate date);

    long countByExpirationDateBetween(LocalDate from, LocalDate to);

    long countByExpirationDateLessThan(LocalDate date);
}
