package com.cslm.service;

import com.cslm.audit.AuditService;
import com.cslm.domain.Team;
import com.cslm.dto.TeamDtos.TeamRequest;
import com.cslm.dto.TeamDtos.TeamResponse;
import com.cslm.exception.ResourceNotFoundException;
import com.cslm.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamService {

    private final TeamRepository teamRepository;
    private final AuditService auditService;

    public List<TeamResponse> findAll() {
        return teamRepository.findAll().stream().map(this::toResponse).toList();
    }

    public TeamResponse findById(Long id) {
        return toResponse(getEntity(id));
    }

    public TeamResponse create(TeamRequest request) {
        Team team = Team.builder()
                .name(request.name())
                .description(request.description())
                .active(request.active() == null || request.active())
                .build();
        team = teamRepository.save(team);
        auditService.logCreate("Team", team.getId());
        return toResponse(team);
    }

    public TeamResponse update(Long id, TeamRequest request) {
        Team team = getEntity(id);
        auditService.logFieldChange("Team", id, "name", team.getName(), request.name());
        auditService.logFieldChange("Team", id, "description", team.getDescription(), request.description());
        auditService.logFieldChange("Team", id, "active", team.getActive(), request.active());
        team.setName(request.name());
        team.setDescription(request.description());
        if (request.active() != null) {
            team.setActive(request.active());
        }
        return toResponse(teamRepository.save(team));
    }

    public void delete(Long id) {
        Team team = getEntity(id);
        teamRepository.delete(team);
        auditService.logDelete("Team", id);
    }

    private Team getEntity(Long id) {
        return teamRepository.findById(id).orElseThrow(() -> ResourceNotFoundException.of("Team", id));
    }

    private TeamResponse toResponse(Team t) {
        return new TeamResponse(t.getId(), t.getName(), t.getDescription(), t.getActive(), t.getCreatedAt(), t.getUpdatedAt());
    }
}
