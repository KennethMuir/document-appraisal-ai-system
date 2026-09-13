ALTER TABLE metadata_records
ADD COLUMN IF NOT EXISTS additional_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_metadata_records_additional_metadata
ON metadata_records USING GIN (additional_metadata);
