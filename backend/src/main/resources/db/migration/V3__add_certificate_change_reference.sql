-- ---------------------------------------------------------------------
-- Traceability: record the CHG (Change) or RITM (Request Item) ticket
-- under which a certificate was last updated.
-- ---------------------------------------------------------------------
ALTER TABLE certificates
    ADD COLUMN last_change_reference VARCHAR(50) NULL AFTER status;

CREATE INDEX idx_certificates_change_reference ON certificates(last_change_reference);
