package com.cslm.repository;

import com.cslm.domain.DeploymentLocation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeploymentLocationRepository extends JpaRepository<DeploymentLocation, Long> {
}
