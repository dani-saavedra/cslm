-- =========================================================================
-- CSLM - Certificate & Secret Lifecycle Manager
-- V1: Initial normalized schema
-- =========================================================================

-- ---------------------------------------------------------------------
-- Security: roles, users
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE users (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255),
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Teams (equipos responsables)
-- ---------------------------------------------------------------------
CREATE TABLE teams (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_teams_name UNIQUE (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Environments (configurable, ordered, not hardcoded)
-- ---------------------------------------------------------------------
CREATE TABLE environments (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    -- TRUE  => productive environment (e.g. Producción)
    -- FALSE => non-productive environment (Desarrollo, laboratorios, etc.)
    production  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INT NOT NULL DEFAULT 0,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_environments_code UNIQUE (code)
) ENGINE=InnoDB;

CREATE INDEX idx_environments_production ON environments(production);

-- ---------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------
CREATE TABLE applications (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    code          VARCHAR(50) NOT NULL,
    description   VARCHAR(1000),
    area          VARCHAR(150),
    team_id       BIGINT,
    owner         VARCHAR(200),
    owner_email   VARCHAR(255),
    criticality   VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_applications_code UNIQUE (code),
    CONSTRAINT fk_applications_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_applications_name ON applications(name);
CREATE INDEX idx_applications_owner ON applications(owner);

-- ---------------------------------------------------------------------
-- Configurable catalogs: asset types (certificate/secret types) and
-- deployment location types
-- ---------------------------------------------------------------------
CREATE TABLE asset_types (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    category    VARCHAR(20) NOT NULL, -- CERTIFICATE | SECRET
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_asset_types_cat_code UNIQUE (category, code)
) ENGINE=InnoDB;

CREATE TABLE location_types (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_location_types_code UNIQUE (code)
) ENGINE=InnoDB;

CREATE TABLE deployment_locations (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(200) NOT NULL,
    location_type_id BIGINT NOT NULL,
    cluster          VARCHAR(150),
    namespace        VARCHAR(150),
    description      VARCHAR(500),
    active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_deployment_locations_type FOREIGN KEY (location_type_id) REFERENCES location_types(id)
) ENGINE=InnoDB;

CREATE INDEX idx_deployment_locations_name ON deployment_locations(name);

-- ---------------------------------------------------------------------
-- Certificates
-- ---------------------------------------------------------------------
CREATE TABLE certificates (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    alias               VARCHAR(200),
    certificate_type_id BIGINT,
    common_name         VARCHAR(255),
    subject             VARCHAR(500),
    issuer              VARCHAR(500),
    serial_number       VARCHAR(255),
    algorithm           VARCHAR(100),
    key_size            INT,
    issue_date          DATE,
    expiration_date     DATE NOT NULL,
    environment_id      BIGINT NOT NULL,
    owner               VARCHAR(200),
    team_id             BIGINT,
    contact_email       VARCHAR(255),
    notes               VARCHAR(2000),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- lifecycle: ACTIVE, REVOKED, RENEWED, RETIRED
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificates_type FOREIGN KEY (certificate_type_id) REFERENCES asset_types(id),
    CONSTRAINT fk_certificates_environment FOREIGN KEY (environment_id) REFERENCES environments(id),
    CONSTRAINT fk_certificates_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_certificates_name ON certificates(name);
CREATE INDEX idx_certificates_alias ON certificates(alias);
CREATE INDEX idx_certificates_serial ON certificates(serial_number);
CREATE INDEX idx_certificates_cn ON certificates(common_name);
CREATE INDEX idx_certificates_owner ON certificates(owner);
CREATE INDEX idx_certificates_expiration ON certificates(expiration_date);
CREATE INDEX idx_certificates_environment ON certificates(environment_id);

-- ---------------------------------------------------------------------
-- Secrets (metadata only - real value lives in an external vault)
-- ---------------------------------------------------------------------
CREATE TABLE secrets (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(200) NOT NULL,
    secret_type_id    BIGINT,
    description       VARCHAR(1000),
    storage_system    VARCHAR(150), -- e.g. HashiCorp Vault, Azure Key Vault, AWS Secrets Manager
    secret_reference  VARCHAR(500), -- external id/path, never the real value
    environment_id    BIGINT NOT NULL,
    owner             VARCHAR(200),
    team_id           BIGINT,
    contact_email     VARCHAR(255),
    expiration_date   DATE,
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes             VARCHAR(2000),
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_secrets_type FOREIGN KEY (secret_type_id) REFERENCES asset_types(id),
    CONSTRAINT fk_secrets_environment FOREIGN KEY (environment_id) REFERENCES environments(id),
    CONSTRAINT fk_secrets_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_secrets_name ON secrets(name);
CREATE INDEX idx_secrets_owner ON secrets(owner);
CREATE INDEX idx_secrets_expiration ON secrets(expiration_date);
CREATE INDEX idx_secrets_environment ON secrets(environment_id);

-- ---------------------------------------------------------------------
-- Application <-> Asset (Certificate|Secret) : many-to-many
-- ---------------------------------------------------------------------
CREATE TABLE application_assets (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    asset_type     VARCHAR(20) NOT NULL, -- CERTIFICATE | SECRET
    asset_id       BIGINT NOT NULL,
    is_primary     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_application_assets_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    CONSTRAINT uq_application_assets UNIQUE (application_id, asset_type, asset_id)
) ENGINE=InnoDB;

CREATE INDEX idx_application_assets_asset ON application_assets(asset_type, asset_id);

-- ---------------------------------------------------------------------
-- Asset <-> Deployment Location (where is it actually deployed)
-- ---------------------------------------------------------------------
CREATE TABLE asset_deployments (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_type            VARCHAR(20) NOT NULL, -- CERTIFICATE | SECRET
    asset_id              BIGINT NOT NULL,
    deployment_location_id BIGINT NOT NULL,
    application_id        BIGINT,
    reference              VARCHAR(255), -- e.g. k8s secret/config name, LB VIP, etc.
    notes                  VARCHAR(1000),
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_asset_deployments_location FOREIGN KEY (deployment_location_id) REFERENCES deployment_locations(id),
    CONSTRAINT fk_asset_deployments_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_asset_deployments_asset ON asset_deployments(asset_type, asset_id);

-- ---------------------------------------------------------------------
-- Notification rules & history
-- ---------------------------------------------------------------------
CREATE TABLE notification_rules (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(150) NOT NULL,
    asset_category VARCHAR(20) NOT NULL DEFAULT 'ALL', -- CERTIFICATE | SECRET | ALL
    days_before    INT NOT NULL, -- 90,60,30,15,7,1,0 (0 = on expiration day). Negative = after expiration.
    enabled        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE notification_history (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_type     VARCHAR(20) NOT NULL,
    asset_id       BIGINT NOT NULL,
    rule_id        BIGINT,
    recipient      VARCHAR(255) NOT NULL,
    subject        VARCHAR(500),
    body           TEXT,
    status         VARCHAR(20) NOT NULL, -- SENT | FAILED
    error_message  VARCHAR(1000),
    sent_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_history_rule FOREIGN KEY (rule_id) REFERENCES notification_rules(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_notification_history_asset ON notification_history(asset_type, asset_id);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at);

-- ---------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL,
    action      VARCHAR(20) NOT NULL, -- CREATE | UPDATE | DELETE
    entity_name VARCHAR(100) NOT NULL,
    entity_id   VARCHAR(50),
    field_name  VARCHAR(100),
    old_value   VARCHAR(2000),
    new_value   VARCHAR(2000),
    timestamp   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_audit_log_entity ON audit_log(entity_name, entity_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- ---------------------------------------------------------------------
-- System settings (key/value) - semaphore thresholds, etc. (configurable)
-- ---------------------------------------------------------------------
CREATE TABLE system_settings (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key   VARCHAR(100) NOT NULL,
    setting_value VARCHAR(500) NOT NULL,
    description   VARCHAR(500),
    CONSTRAINT uq_system_settings_key UNIQUE (setting_key)
) ENGINE=InnoDB;
