package com.cslm.repository;

import com.cslm.domain.Environment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnvironmentRepository extends JpaRepository<Environment, Long> {
    List<Environment> findAllByOrderBySortOrderAsc();
    List<Environment> findAllByActiveTrueOrderBySortOrderAsc();
}
