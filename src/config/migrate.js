import 'dotenv/config';
import { pool } from './database.js';

const migrations = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;;
-- ─── Pending Signups ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    company_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(100) NOT NULL,

    job_title VARCHAR(100) NOT NULL,
    phone VARCHAR(30),

    branches JSONB DEFAULT '[]',

    logo_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);
-- ─── Companies (Tenants) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(100) NOT NULL,
  branches      TEXT[],
  departments   TEXT[],
  logo_url      VARCHAR(500),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id          UUID REFERENCES companies(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL UNIQUE,
  password_hash       VARCHAR(255),
  role                VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'hr', 'employee')),
  job_title           VARCHAR(255),
  department          VARCHAR(255),
  branch              VARCHAR(255),
  phone               VARCHAR(30),
  address             VARCHAR(500),
  national_id         VARCHAR(50),
  birth_date          DATE,
  employee_code       VARCHAR(50),
  hire_date           DATE,
  direct_manager      VARCHAR(255),
  employment_type     VARCHAR(50),
  profile_image_url   VARCHAR(500),

  -- OAuth
  google_id           VARCHAR(255),
  facebook_id         VARCHAR(255),
  auth_provider       VARCHAR(20) DEFAULT 'local' CHECK (auth_provider IN ('local', 'google', 'facebook')),

  -- Account state
  is_active           BOOLEAN DEFAULT FALSE,
  is_verified         BOOLEAN DEFAULT FALSE,
  invite_token        UUID DEFAULT uuid_generate_v4(),
  invite_sent_at      TIMESTAMPTZ,
  invite_accepted_at  TIMESTAMPTZ,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── OTP Codes (kept for manager login 2FA only) ──────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  email       VARCHAR(255) NOT NULL,
  code        VARCHAR(6) NOT NULL,
  purpose     VARCHAR(50) NOT NULL CHECK (purpose IN ('signup', 'login')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  attempts    INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Refresh Tokens ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Employee Documents ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employee_documents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name   VARCHAR(255) NOT NULL,
  file_url    VARCHAR(500) NOT NULL,
  file_size   INT,
  mime_type   VARCHAR(100),
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_company       ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_invite_token  ON users(invite_token);
CREATE INDEX IF NOT EXISTS idx_users_google_id     ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_facebook_id   ON users(facebook_id);
CREATE INDEX IF NOT EXISTS idx_otp_email           ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_user            ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_user        ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_docs_user           ON employee_documents(user_id);

-- ─── Update Trigger ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
    CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
`;

const runMigrations = async () => {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(migrations);
    console.log(' Migrations completed successfully');
  } catch (err) {
    console.error(' Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
