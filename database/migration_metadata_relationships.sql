BEGIN;

-- ============================================================
-- DOCUMENT APPRAISAL AI SYSTEM
-- Migration: metadata relationships, sections, upload numbering
-- ============================================================

-- 1. One metadata record may be linked to MANY documents.
-- Remove the previous one-document-per-metadata restriction.
DROP INDEX IF EXISTS documents_metadata_record_unique;

-- 2. Add a flexible Section field to the metadata registry.
-- This is intentionally free text so users can use existing
-- sections or enter custom sections.
ALTER TABLE metadata_records
    ADD COLUMN IF NOT EXISTS section VARCHAR(255);

-- 3. Add a permanent database-backed upload number.
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS upload_number BIGINT;

-- 4. Backfill existing documents from their existing DOC-N codes.
UPDATE documents
SET upload_number =
    CAST(SUBSTRING(document_code FROM 5) AS BIGINT)
WHERE upload_number IS NULL
  AND document_code ~ '^DOC-[0-9]+$';

-- 5. Safety check: every existing document must have a valid number.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM documents
        WHERE upload_number IS NULL
    ) THEN
        RAISE EXCEPTION
            'Migration stopped: one or more documents do not have a valid DOC-N document_code.';
    END IF;
END
$$;

-- 6. Make upload numbers unique and mandatory.
CREATE UNIQUE INDEX IF NOT EXISTS documents_upload_number_key
    ON documents(upload_number);

ALTER TABLE documents
    ALTER COLUMN upload_number SET NOT NULL;

-- 7. Create a PostgreSQL sequence for future document uploads.
CREATE SEQUENCE IF NOT EXISTS document_upload_number_seq
    AS BIGINT
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 8. Position the sequence after the highest existing upload number.
SELECT setval(
    'document_upload_number_seq',
    COALESCE((SELECT MAX(upload_number) FROM documents), 0),
    true
);

COMMIT;
