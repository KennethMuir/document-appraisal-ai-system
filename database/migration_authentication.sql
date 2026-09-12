-- M10 Authentication & Multi-user
-- Authentication foundation only.
-- Does not alter the existing document/metadata relationships.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'VIEWER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_role_valid
        CHECK (role IN ('ADMIN', 'APPRAISER', 'VIEWER'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key
    ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,
    token_hash BYTEA NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    CONSTRAINT sessions_token_hash_unique
        UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx
    ON sessions (user_id);

CREATE INDEX IF NOT EXISTS sessions_expires_at_idx
    ON sessions (expires_at);

CREATE INDEX IF NOT EXISTS sessions_active_lookup_idx
    ON sessions (token_hash, expires_at)
    WHERE revoked_at IS NULL;
