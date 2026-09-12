-- M12 Storage Ownership & Provider Foundation
--
-- Adds document ownership and a provider-neutral storage reference.
-- Existing physical files remain exactly where they are.
-- No document binary is stored in PostgreSQL.

BEGIN;

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS owner_user_id BIGINT
        REFERENCES users(id)
        ON DELETE RESTRICT;

ALTER TABLE document_files
    ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(30)
        NOT NULL DEFAULT 'LOCAL';

ALTER TABLE document_files
    ADD COLUMN IF NOT EXISTS storage_reference TEXT;

ALTER TABLE document_files
    ADD CONSTRAINT document_files_storage_provider_valid
    CHECK (
        storage_provider IN ('LOCAL', 'SERVER', 'CLOUD')
    );

-- Existing documents were created before ownership existed.
-- Assign them to the earliest active ADMIN account.
DO $$
DECLARE
    bootstrap_admin_id BIGINT;
    unowned_count BIGINT;
BEGIN
    SELECT id
    INTO bootstrap_admin_id
    FROM users
    WHERE role = 'ADMIN'
      AND is_active = TRUE
    ORDER BY id
    LIMIT 1;

    SELECT COUNT(*)
    INTO unowned_count
    FROM documents
    WHERE owner_user_id IS NULL;

    IF unowned_count > 0 AND bootstrap_admin_id IS NULL THEN
        RAISE EXCEPTION
            'M12 migration requires an active ADMIN user to own existing documents.';
    END IF;

    IF bootstrap_admin_id IS NOT NULL THEN
        UPDATE documents
        SET owner_user_id = bootstrap_admin_id
        WHERE owner_user_id IS NULL;
    END IF;
END
$$;

UPDATE document_files
SET storage_reference = storage_path
WHERE storage_reference IS NULL;

ALTER TABLE documents
    ALTER COLUMN owner_user_id SET NOT NULL;

ALTER TABLE document_files
    ALTER COLUMN storage_reference SET NOT NULL;

CREATE INDEX IF NOT EXISTS documents_owner_user_id_idx
    ON documents (owner_user_id);

CREATE INDEX IF NOT EXISTS document_files_storage_provider_idx
    ON document_files (storage_provider);

COMMIT;
