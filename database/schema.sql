CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metadata_records (
    id BIGSERIAL PRIMARY KEY,
    reference_code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500),
    document_date DATE,
    year INTEGER,
    person_name VARCHAR(255),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'AWAITING_DOCUMENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    document_code VARCHAR(100) NOT NULL UNIQUE,
    filename VARCHAR(500) NOT NULL,
    title VARCHAR(500),
    document_date DATE,
    upload_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    year INTEGER,
    person_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'UNLINKED',
    metadata_record_id BIGINT REFERENCES metadata_records(id) ON DELETE SET NULL,
    department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL,
    document_type_id BIGINT REFERENCES document_types(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_files (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    original_filename VARCHAR(500) NOT NULL,
    stored_filename VARCHAR(500) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(150),
    file_size BIGINT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_extractions (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    extracted_text TEXT,
    extracted_title VARCHAR(500),
    extracted_date DATE,
    extracted_year INTEGER,
    extracted_person_name VARCHAR(255),
    extraction_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_matches (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    metadata_record_id BIGINT REFERENCES metadata_records(id) ON DELETE SET NULL,
    match_type VARCHAR(50) NOT NULL,
    confidence NUMERIC(5,2),
    matching_fields TEXT,
    conflicting_fields TEXT,
    decision VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT REFERENCES documents(id) ON DELETE SET NULL,
    metadata_record_id BIGINT REFERENCES metadata_records(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO departments (name, code, description)
VALUES
    ('Human Resources', 'HR', 'Human resources and employee records'),
    ('Finance', 'FIN', 'Financial and accounting records'),
    ('Procurement', 'PROC', 'Procurement and purchasing records'),
    ('Engineering', 'ENG', 'Engineering and technical records'),
    ('ICT', 'ICT', 'Information and communications technology records'),
    ('Legal', 'LEGAL', 'Legal and compliance records'),
    ('Operations', 'OPS', 'Operational records'),
    ('Administration', 'ADMIN', 'Administrative records')
ON CONFLICT (code) DO NOTHING;

INSERT INTO document_types (name, description)
VALUES
    ('Employee Profile', 'Employee and personnel records'),
    ('Financial Report', 'Financial reports and statements'),
    ('Procurement Report', 'Procurement reports and documentation'),
    ('Contract', 'Contracts and agreements'),
    ('Policy', 'Policies and internal procedures'),
    ('Memo', 'Internal memoranda'),
    ('Meeting Minutes', 'Minutes and meeting records'),
    ('Technical Report', 'Engineering and technical reports'),
    ('Other', 'Other document types')
ON CONFLICT (name) DO NOTHING;
