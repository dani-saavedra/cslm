-- ---------------------------------------------------------------------
-- Users <-> Teams (many-to-many): so that notifications addressed to a
-- team's contact reach every user who belongs to that team.
-- ---------------------------------------------------------------------
CREATE TABLE user_teams (
    user_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, team_id),
    CONSTRAINT fk_user_teams_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_teams_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_user_teams_team ON user_teams (team_id);
