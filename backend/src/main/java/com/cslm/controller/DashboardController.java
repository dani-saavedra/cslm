package com.cslm.controller;

import com.cslm.dto.DashboardDtos.DashboardSummaryResponse;
import com.cslm.dto.DashboardDtos.ExpiringAssetResponse;
import com.cslm.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return dashboardService.summary();
    }

    @GetMapping("/expiring")
    public List<ExpiringAssetResponse> expiring(@RequestParam(required = false) Integer withinDays) {
        return dashboardService.expiring(withinDays);
    }
}
