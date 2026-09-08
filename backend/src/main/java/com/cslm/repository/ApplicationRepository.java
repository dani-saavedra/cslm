package com.cslm.repository;

import com.cslm.domain.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long>, JpaSpecificationExecutor<Application> {
    Optional<Application> findByCode(String code);
    boolean existsByCode(String code);

    @Query("select a from Application a where lower(a.name) like lower(concat('%', :term, '%')) " +
            "or lower(a.code) like lower(concat('%', :term, '%')) " +
            "or lower(a.owner) like lower(concat('%', :term, '%')) " +
            "or lower(a.ownerEmail) like lower(concat('%', :term, '%'))")
    Page<Application> search(@Param("term") String term, Pageable pageable);
}
