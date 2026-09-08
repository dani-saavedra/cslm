-- =========================================================================
-- CSLM - Seed data for local/demo use
-- Password for all demo users follows pattern "<Role>123!" (e.g. Admin123!)
-- =========================================================================

-- ---------------------------------------------------------------------
-- Roles & users
-- ---------------------------------------------------------------------
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Full access: manage catalogs, users, environments and all assets'),
    ('OPERATOR', 'Create/update certificates, secrets and relationships'),
    ('VIEWER', 'Read-only access');

INSERT INTO users (username, password_hash, email, full_name, active) VALUES
    ('admin', '$2y$10$BErqvBWBS3EOJRCDJ6G9SeThYRiMPKpV9MENhs49QwK9CCN0M0DFO', 'admin@cslm.example.com', 'CSLM Administrator', TRUE),
    ('operator', '$2y$10$lprMh4l.FTPdSrcAmoBCG.Dz35EYM4OJhMvH/rnkvEBgZ/oe6bq7q', 'operator@cslm.example.com', 'CSLM Operator', TRUE),
    ('viewer', '$2y$10$/ViG21aMqpSQ4Q05HAtFheIzKLLINbVmnUlDcXHeMhpywrr.qm0sG', 'viewer@cslm.example.com', 'CSLM Viewer', TRUE);

INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.name = 'ADMIN';
INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'operator' AND r.name = 'OPERATOR';
INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'viewer' AND r.name = 'VIEWER';

-- ---------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------
INSERT INTO teams (name, description) VALUES
    ('Core Banking', 'Owns corporate and mobile banking platforms'),
    ('Payments Engineering', 'Owns the payments processing platform'),
    ('Treasury IT', 'Owns treasury systems'),
    ('Platform Security', 'Central PKI and secrets management team');

-- ---------------------------------------------------------------------
-- Environments (ordered, configurable)
-- production = TRUE  -> productive environment
-- production = FALSE -> non-productive environment
-- ---------------------------------------------------------------------
INSERT INTO environments (name, code, description, production, sort_order, active) VALUES
    ('Desarrollo', 'DESARROLLO', 'Ambiente de desarrollo', FALSE, 1, TRUE),
    ('Laboratorio Proyectos', 'LAB_PROYECTOS', 'Laboratorio de proyectos', FALSE, 2, TRUE),
    ('Laboratorio Contención', 'LAB_CONTENCION', 'Laboratorio de contención', FALSE, 3, TRUE),
    ('Laboratorio Postproducción', 'LAB_POSTPRODUCCION', 'Laboratorio de postproducción', FALSE, 4, TRUE),
    ('Producción', 'PRODUCCION', 'Ambiente productivo', TRUE, 5, TRUE);

-- ---------------------------------------------------------------------
-- Asset type catalogs (configurable)
-- ---------------------------------------------------------------------
INSERT INTO asset_types (category, code, name, description, active) VALUES
    ('CERTIFICATE', 'TLS_SERVER', 'TLS Server Certificate', 'Server-side TLS/SSL certificate', TRUE),
    ('CERTIFICATE', 'TLS_CLIENT', 'TLS Client Certificate', 'Mutual-TLS client certificate', TRUE),
    ('CERTIFICATE', 'CODE_SIGNING', 'Code Signing Certificate', 'Used to sign binaries/artifacts', TRUE),
    ('CERTIFICATE', 'CA_ROOT', 'Root CA', 'Root certificate authority', TRUE),
    ('CERTIFICATE', 'CA_INTERMEDIATE', 'Intermediate CA', 'Intermediate certificate authority', TRUE),
    ('SECRET', 'API_KEY', 'API Key', 'Third-party or internal API key', TRUE),
    ('SECRET', 'DATABASE_CREDENTIAL', 'Database Credential', 'Database username/password pair', TRUE),
    ('SECRET', 'SERVICE_ACCOUNT', 'Service Account', 'Service account credential', TRUE),
    ('SECRET', 'ENCRYPTION_KEY', 'Encryption Key', 'Symmetric/asymmetric encryption key', TRUE),
    ('SECRET', 'OAUTH_CLIENT_SECRET', 'OAuth Client Secret', 'OAuth2/OIDC client secret', TRUE);

-- ---------------------------------------------------------------------
-- Deployment location types & locations (configurable)
-- ---------------------------------------------------------------------
INSERT INTO location_types (code, name, description, active) VALUES
    ('KUBERNETES', 'Kubernetes', 'Kubernetes cluster', TRUE),
    ('OPENSHIFT', 'OpenShift', 'Red Hat OpenShift cluster', TRUE),
    ('VM', 'Virtual Machine', 'Traditional virtual machine', TRUE),
    ('LOAD_BALANCER', 'Load Balancer', 'Generic load balancer', TRUE),
    ('F5', 'F5 BIG-IP', 'F5 appliance', TRUE),
    ('HAPROXY', 'HAProxy', 'HAProxy instance', TRUE),
    ('API_GATEWAY', 'API Gateway', 'API gateway', TRUE),
    ('APPLICATION_SERVER', 'Application Server', 'e.g. Tomcat, WebLogic, JBoss', TRUE),
    ('DATABASE', 'Database', 'Database server/service', TRUE),
    ('CLOUD_SERVICE', 'Cloud Service', 'Managed cloud service', TRUE),
    ('OTHER', 'Other', 'Other/unclassified location', TRUE);

INSERT INTO deployment_locations (name, location_type_id, cluster, namespace, description, active)
SELECT 'OCP-PROD-01', lt.id, 'OCP-PROD-01', 'corporate-banking', 'Production OpenShift cluster', TRUE FROM location_types lt WHERE lt.code = 'OPENSHIFT';
INSERT INTO deployment_locations (name, location_type_id, cluster, namespace, description, active)
SELECT 'OCP-QA-01', lt.id, 'OCP-QA-01', 'corporate-banking-qa', 'QA OpenShift cluster', TRUE FROM location_types lt WHERE lt.code = 'OPENSHIFT';
INSERT INTO deployment_locations (name, location_type_id, cluster, namespace, description, active)
SELECT 'AKS-PROD-01', lt.id, 'AKS-PROD-01', 'payments', 'Production AKS cluster for payments', TRUE FROM location_types lt WHERE lt.code = 'KUBERNETES';
INSERT INTO deployment_locations (name, location_type_id, cluster, namespace, description, active)
SELECT 'F5-DMZ-01', lt.id, NULL, NULL, 'DMZ-facing F5 pair', TRUE FROM location_types lt WHERE lt.code = 'F5';
INSERT INTO deployment_locations (name, location_type_id, cluster, namespace, description, active)
SELECT 'LB-PROD-01', lt.id, NULL, NULL, 'Production load balancer', TRUE FROM location_types lt WHERE lt.code = 'LOAD_BALANCER';
INSERT INTO deployment_locations (name, location_type_id, cluster, namespace, description, active)
SELECT 'VM-TREASURY-LEGACY-01', lt.id, NULL, NULL, 'Legacy treasury VM', TRUE FROM location_types lt WHERE lt.code = 'VM';
INSERT INTO deployment_locations (name, location_type_id, cluster, namespace, description, active)
SELECT 'APIGW-PROD', lt.id, NULL, NULL, 'Production API gateway', TRUE FROM location_types lt WHERE lt.code = 'API_GATEWAY';
INSERT INTO deployment_locations (name, location_type_id, cluster, namespace, description, active)
SELECT 'RDS-PROD', lt.id, NULL, NULL, 'Production managed database', TRUE FROM location_types lt WHERE lt.code = 'DATABASE';

-- ---------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------
INSERT INTO applications (name, code, description, area, team_id, owner, owner_email, criticality, status)
SELECT 'Corporate Banking', 'CORP-BANK', 'Corporate online banking platform', 'Retail Banking', t.id, 'Jane Smith', 'jane.smith@example.com', 'CRITICAL', 'ACTIVE'
FROM teams t WHERE t.name = 'Core Banking';

INSERT INTO applications (name, code, description, area, team_id, owner, owner_email, criticality, status)
SELECT 'Mobile Banking', 'MOB-BANK', 'Mobile banking app backend', 'Retail Banking', t.id, 'Carlos Ruiz', 'carlos.ruiz@example.com', 'HIGH', 'ACTIVE'
FROM teams t WHERE t.name = 'Core Banking';

INSERT INTO applications (name, code, description, area, team_id, owner, owner_email, criticality, status)
SELECT 'Payments', 'PAYMENTS', 'Payments processing platform', 'Payments', t.id, 'Ana Torres', 'ana.torres@example.com', 'CRITICAL', 'ACTIVE'
FROM teams t WHERE t.name = 'Payments Engineering';

INSERT INTO applications (name, code, description, area, team_id, owner, owner_email, criticality, status)
SELECT 'Treasury', 'TREASURY', 'Treasury management system', 'Treasury', t.id, 'Mark Lee', 'mark.lee@example.com', 'MEDIUM', 'ACTIVE'
FROM teams t WHERE t.name = 'Treasury IT';

-- ---------------------------------------------------------------------
-- Certificates
-- Reference date used to pick demo dates: 2026-09-05 (today)
-- ---------------------------------------------------------------------
INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'api-prod', 'corporate-api-prod', at.id, 'api.corporatebanking.example.com', 'CN=api.corporatebanking.example.com,O=Example Corp', 'DigiCert Global CA', 'AA1122334455', 'RSA', 2048, '2025-04-20', '2027-04-20', e.id, 'Jane Smith', t.id, 'jane.smith@example.com', 'Primary public API certificate', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='PRODUCCION' AND t.name='Core Banking';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'payments-prod', 'payments-gateway-prod', at.id, 'gateway.payments.example.com', 'CN=gateway.payments.example.com,O=Example Corp', 'DigiCert Global CA', 'BB2233445566', 'RSA', 2048, '2025-11-20', '2026-11-20', e.id, 'Ana Torres', t.id, 'ana.torres@example.com', 'Payment gateway inbound TLS', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='PRODUCCION' AND t.name='Payments Engineering';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'mobile-prod', 'mobile-api-prod', at.id, 'api.mobilebanking.example.com', 'CN=api.mobilebanking.example.com,O=Example Corp', 'DigiCert Global CA', 'CC3344556677', 'ECDSA', 256, '2024-09-20', '2026-09-20', e.id, 'Carlos Ruiz', t.id, 'carlos.ruiz@example.com', 'Mobile API TLS certificate', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='PRODUCCION' AND t.name='Core Banking';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'corporate-prod', 'corporate-web-prod', at.id, 'www.corporatebanking.example.com', 'CN=www.corporatebanking.example.com,O=Example Corp', 'DigiCert Global CA', 'DD4455667788', 'RSA', 2048, '2024-09-10', '2026-09-10', e.id, 'Jane Smith', t.id, 'jane.smith@example.com', 'Public web front-end certificate - renewal in progress', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='PRODUCCION' AND t.name='Core Banking';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'legacy-prod', 'treasury-legacy-prod', at.id, 'treasury-legacy.example.com', 'CN=treasury-legacy.example.com,O=Example Corp', 'Internal CA', 'EE5566778899', 'RSA', 2048, '2024-08-20', '2026-08-20', e.id, 'Mark Lee', t.id, 'mark.lee@example.com', 'Legacy system pending decommission', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='PRODUCCION' AND t.name='Treasury IT';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'corporate-qa', 'corporate-api-qa', at.id, 'api-qa.corporatebanking.example.com', 'CN=api-qa.corporatebanking.example.com,O=Example Corp', 'Internal CA', 'FF6677889900', 'RSA', 2048, '2025-10-01', '2026-10-01', e.id, 'Jane Smith', t.id, 'jane.smith@example.com', 'QA replica of production API certificate', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='LAB_PROYECTOS' AND t.name='Core Banking';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'corporate-dev', 'corporate-api-dev', at.id, 'api-dev.corporatebanking.example.com', 'CN=api-dev.corporatebanking.example.com,O=Example Corp', 'Internal CA', 'GG7788990011', 'RSA', 2048, '2026-01-15', '2027-01-15', e.id, 'Jane Smith', t.id, 'jane.smith@example.com', 'Development self-signed certificate', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='DESARROLLO' AND t.name='Core Banking';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'mobile-qa', 'mobile-api-qa', at.id, 'api-qa.mobilebanking.example.com', 'CN=api-qa.mobilebanking.example.com,O=Example Corp', 'Internal CA', 'HH8899001122', 'ECDSA', 256, '2025-12-01', '2026-12-01', e.id, 'Carlos Ruiz', t.id, 'carlos.ruiz@example.com', 'QA mobile API certificate', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='LAB_PROYECTOS' AND t.name='Core Banking';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'payments-dr', 'payments-gateway-dr', at.id, 'gateway-dr.payments.example.com', 'CN=gateway-dr.payments.example.com,O=Example Corp', 'DigiCert Global CA', 'II9900112233', 'RSA', 2048, '2026-03-01', '2027-03-01', e.id, 'Ana Torres', t.id, 'ana.torres@example.com', 'DR site payment gateway certificate', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='LAB_CONTENCION' AND t.name='Payments Engineering';

INSERT INTO certificates (name, alias, certificate_type_id, common_name, subject, issuer, serial_number, algorithm, key_size, issue_date, expiration_date, environment_id, owner, team_id, contact_email, notes, status)
SELECT 'treasury-staging', 'treasury-api-staging', at.id, 'api-staging.treasury.example.com', 'CN=api-staging.treasury.example.com,O=Example Corp', 'Internal CA', 'JJ0011223344', 'RSA', 2048, '2025-09-25', '2026-09-25', e.id, 'Mark Lee', t.id, 'mark.lee@example.com', 'Staging environment ahead of legacy decommission', 'ACTIVE'
FROM asset_types at, environments e, teams t WHERE at.category='CERTIFICATE' AND at.code='TLS_SERVER' AND e.code='LAB_POSTPRODUCCION' AND t.name='Treasury IT';

-- ---------------------------------------------------------------------
-- Secrets
-- ---------------------------------------------------------------------
INSERT INTO secrets (name, secret_type_id, description, storage_system, secret_reference, environment_id, owner, team_id, contact_email, expiration_date, status, notes)
SELECT 'corporate-db-cred', st.id, 'Database credential for corporate banking primary DB', 'HashiCorp Vault', 'secret/corporate-banking/db', e.id, 'Jane Smith', t.id, 'jane.smith@example.com', NULL, 'ACTIVE', 'Rotated quarterly via Vault policy'
FROM asset_types st, environments e, teams t WHERE st.category='SECRET' AND st.code='DATABASE_CREDENTIAL' AND e.code='PRODUCCION' AND t.name='Core Banking';

INSERT INTO secrets (name, secret_type_id, description, storage_system, secret_reference, environment_id, owner, team_id, contact_email, expiration_date, status, notes)
SELECT 'payments-api-key', st.id, 'API key for card network integration', 'AWS Secrets Manager', 'arn:aws:secretsmanager:us-east-1:123456789012:secret:payments/api-key', e.id, 'Ana Torres', t.id, 'ana.torres@example.com', '2026-10-05', 'ACTIVE', 'Rotate before expiration per vendor policy'
FROM asset_types st, environments e, teams t WHERE st.category='SECRET' AND st.code='API_KEY' AND e.code='PRODUCCION' AND t.name='Payments Engineering';

INSERT INTO secrets (name, secret_type_id, description, storage_system, secret_reference, environment_id, owner, team_id, contact_email, expiration_date, status, notes)
SELECT 'mobile-oauth-secret', st.id, 'OAuth2 client secret for mobile app backend', 'Azure Key Vault', 'https://cslm-kv.vault.azure.net/secrets/mobile-oauth-client', e.id, 'Carlos Ruiz', t.id, 'carlos.ruiz@example.com', '2026-09-12', 'ACTIVE', 'Consumed by mobile BFF service'
FROM asset_types st, environments e, teams t WHERE st.category='SECRET' AND st.code='OAUTH_CLIENT_SECRET' AND e.code='PRODUCCION' AND t.name='Core Banking';

INSERT INTO secrets (name, secret_type_id, description, storage_system, secret_reference, environment_id, owner, team_id, contact_email, expiration_date, status, notes)
SELECT 'treasury-service-account', st.id, 'Service account used by treasury batch jobs', 'HashiCorp Vault', 'secret/treasury/svc-account', e.id, 'Mark Lee', t.id, 'mark.lee@example.com', NULL, 'ACTIVE', 'No expiration - monitored manually'
FROM asset_types st, environments e, teams t WHERE st.category='SECRET' AND st.code='SERVICE_ACCOUNT' AND e.code='DESARROLLO' AND t.name='Treasury IT';

INSERT INTO secrets (name, secret_type_id, description, storage_system, secret_reference, environment_id, owner, team_id, contact_email, expiration_date, status, notes)
SELECT 'corporate-encryption-key', st.id, 'Field-level encryption key for PII data', 'HashiCorp Vault', 'secret/corporate-banking/enc-key', e.id, 'Jane Smith', t.id, 'jane.smith@example.com', '2027-06-01', 'ACTIVE', 'Used by data-at-rest encryption module'
FROM asset_types st, environments e, teams t WHERE st.category='SECRET' AND st.code='ENCRYPTION_KEY' AND e.code='LAB_PROYECTOS' AND t.name='Core Banking';

-- ---------------------------------------------------------------------
-- Application <-> Asset associations
-- ---------------------------------------------------------------------
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='CORP-BANK' AND c.name='api-prod';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='CORP-BANK' AND c.name='corporate-prod';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='CORP-BANK' AND c.name='corporate-qa';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='CORP-BANK' AND c.name='corporate-dev';
-- api-prod is shared between Corporate Banking and Payments (demonstrates N:M)
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, FALSE FROM applications a, certificates c WHERE a.code='PAYMENTS' AND c.name='api-prod';

INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='MOB-BANK' AND c.name='mobile-prod';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='MOB-BANK' AND c.name='mobile-qa';

INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='PAYMENTS' AND c.name='payments-prod';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='PAYMENTS' AND c.name='payments-dr';

INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='TREASURY' AND c.name='legacy-prod';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'CERTIFICATE', c.id, TRUE FROM applications a, certificates c WHERE a.code='TREASURY' AND c.name='treasury-staging';

INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'SECRET', s.id, TRUE FROM applications a, secrets s WHERE a.code='CORP-BANK' AND s.name='corporate-db-cred';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'SECRET', s.id, TRUE FROM applications a, secrets s WHERE a.code='CORP-BANK' AND s.name='corporate-encryption-key';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'SECRET', s.id, TRUE FROM applications a, secrets s WHERE a.code='PAYMENTS' AND s.name='payments-api-key';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'SECRET', s.id, TRUE FROM applications a, secrets s WHERE a.code='MOB-BANK' AND s.name='mobile-oauth-secret';
INSERT INTO application_assets (application_id, asset_type, asset_id, is_primary)
SELECT a.id, 'SECRET', s.id, TRUE FROM applications a, secrets s WHERE a.code='TREASURY' AND s.name='treasury-service-account';

-- ---------------------------------------------------------------------
-- Asset deployments (where each asset is actually deployed)
-- ---------------------------------------------------------------------
INSERT INTO asset_deployments (asset_type, asset_id, deployment_location_id, application_id, reference, notes)
SELECT 'CERTIFICATE', c.id, dl.id, a.id, 'tls-corporate-api', 'Mounted as OpenShift TLS secret'
FROM certificates c, deployment_locations dl, applications a
WHERE c.name='api-prod' AND dl.name='OCP-PROD-01' AND a.code='CORP-BANK';

INSERT INTO asset_deployments (asset_type, asset_id, deployment_location_id, application_id, reference, notes)
SELECT 'CERTIFICATE', c.id, dl.id, a.id, 'corporate-web-vip', 'Terminated at F5 for public web traffic'
FROM certificates c, deployment_locations dl, applications a
WHERE c.name='corporate-prod' AND dl.name='F5-DMZ-01' AND a.code='CORP-BANK';

INSERT INTO asset_deployments (asset_type, asset_id, deployment_location_id, application_id, reference, notes)
SELECT 'CERTIFICATE', c.id, dl.id, a.id, 'tls-corporate-api-qa', 'QA namespace TLS secret'
FROM certificates c, deployment_locations dl, applications a
WHERE c.name='corporate-qa' AND dl.name='OCP-QA-01' AND a.code='CORP-BANK';

INSERT INTO asset_deployments (asset_type, asset_id, deployment_location_id, application_id, reference, notes)
SELECT 'CERTIFICATE', c.id, dl.id, a.id, 'payments-gateway-vip', 'Production AKS ingress certificate'
FROM certificates c, deployment_locations dl, applications a
WHERE c.name='payments-prod' AND dl.name='AKS-PROD-01' AND a.code='PAYMENTS';

INSERT INTO asset_deployments (asset_type, asset_id, deployment_location_id, application_id, reference, notes)
SELECT 'CERTIFICATE', c.id, dl.id, a.id, 'mobile-api-vip', 'Production load balancer VIP'
FROM certificates c, deployment_locations dl, applications a
WHERE c.name='mobile-prod' AND dl.name='LB-PROD-01' AND a.code='MOB-BANK';

INSERT INTO asset_deployments (asset_type, asset_id, deployment_location_id, application_id, reference, notes)
SELECT 'CERTIFICATE', c.id, dl.id, a.id, 'treasury-legacy-vm', 'Deployed directly on legacy VM'
FROM certificates c, deployment_locations dl, applications a
WHERE c.name='legacy-prod' AND dl.name='VM-TREASURY-LEGACY-01' AND a.code='TREASURY';

INSERT INTO asset_deployments (asset_type, asset_id, deployment_location_id, application_id, reference, notes)
SELECT 'SECRET', s.id, dl.id, a.id, 'db-cred-corporate', 'Injected via Vault Agent sidecar'
FROM secrets s, deployment_locations dl, applications a
WHERE s.name='corporate-db-cred' AND dl.name='RDS-PROD' AND a.code='CORP-BANK';

INSERT INTO asset_deployments (asset_type, asset_id, deployment_location_id, application_id, reference, notes)
SELECT 'SECRET', s.id, dl.id, a.id, 'payments-api-key-ref', 'Consumed at API gateway'
FROM secrets s, deployment_locations dl, applications a
WHERE s.name='payments-api-key' AND dl.name='APIGW-PROD' AND a.code='PAYMENTS';

-- ---------------------------------------------------------------------
-- Notification rules (thresholds configurable; not all enabled by default)
-- ---------------------------------------------------------------------
INSERT INTO notification_rules (name, asset_category, days_before, enabled) VALUES
    ('90 days before expiration', 'ALL', 90, FALSE),
    ('60 days before expiration', 'ALL', 60, FALSE),
    ('30 days before expiration', 'ALL', 30, TRUE),
    ('15 days before expiration', 'ALL', 15, FALSE),
    ('7 days before expiration', 'ALL', 7, TRUE),
    ('1 day before expiration', 'ALL', 1, TRUE),
    ('On expiration day', 'ALL', 0, TRUE);

-- ---------------------------------------------------------------------
-- System settings: semaphore thresholds (days remaining)
-- red: days <= RED_MAX_DAYS ; orange: days <= ORANGE_MAX_DAYS ; yellow: days <= YELLOW_MAX_DAYS ; else green ; days < 0 => EXPIRED
-- ---------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
    ('SEMAPHORE_RED_MAX_DAYS', '7', 'Days remaining at or below this value => RED'),
    ('SEMAPHORE_ORANGE_MAX_DAYS', '30', 'Days remaining at or below this value (and above red) => ORANGE'),
    ('SEMAPHORE_YELLOW_MAX_DAYS', '90', 'Days remaining at or below this value (and above orange) => YELLOW');
