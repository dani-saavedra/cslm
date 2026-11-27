-- ---------------------------------------------------------------------
-- Store the public certificate content (PEM, X.509) uploaded on creation
-- or edition, so it can later be downloaded as a .crt file. This is the
-- public certificate only - private key material is never stored here.
-- ---------------------------------------------------------------------
ALTER TABLE certificates
    ADD COLUMN certificate_pem LONGTEXT NULL AFTER last_change_reference;
