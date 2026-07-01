import crypto from "crypto";
import { pool } from "../../config/database.js";

// ─── Mangers PendingSignup ────────────────────────────────────────────────────────────
export const createManagerFromPending = async (pending) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: existing } = await client.query(
      `SELECT id FROM users WHERE email=$1`,
      [pending.email],
    );

    if (existing.length) {
      throw Object.assign(new Error("Email already registered"), {
        statusCode: 409,
      });
    }

    const { rows: companyRows } = await client.query(
      `
      INSERT INTO companies
      (
        name,
        type,
        branches,
        logo_url
      )
      VALUES
      ($1,$2,$3,$4)
      RETURNING id
      `,
      [
        pending.company_name,
        pending.company_type,
        pending.branches || [],
        pending.logo_url,
      ],
    );

    const companyId = companyRows[0].id;

    const { rows: userRows } = await client.query(
      `
      INSERT INTO users
      (
        company_id,
        name,
        email,
        password_hash,
        role,
        job_title,
        phone,
        is_active,
        is_verified
      )
      VALUES
      (
        $1,$2,$3,$4,
        'manager',
        $5,$6,
        true,
        true
      )
      RETURNING *
      `,
      [
        companyId,
        pending.name,
        pending.email,
        pending.password_hash,
        pending.job_title,
        pending.phone,
      ],
    );

    await client.query(`DELETE FROM pending_signups WHERE email=$1`, [
      pending.email,
    ]);

    await client.query("COMMIT");

    return userRows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const findPendingSignup = async (email) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const { rows } = await pool.query(
    `
    SELECT *
    FROM pending_signups
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [normalizedEmail],
  );

  return rows[0] || null;
};
export const pendingSignupExists = async (email) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const { rows } = await pool.query(
    `
    SELECT id
    FROM pending_signups
    WHERE LOWER(email) = LOWER($1)
    `,
    [normalizedEmail],
  );

  return rows.length > 0;
};
export const createPendingSignup = async ({
  name,
  email,
  passwordHash,
  companyName,
  companyType,
  jobTitle,
  phone,
  branches,
  logoUrl,
}) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE LOWER(email)=LOWER($1)`,
    [normalizedEmail],
  );

  if (rows.length) {
    throw Object.assign(new Error("Email already registered"), {
      statusCode: 409,
    });
  }

  await pool.query(
    `
    INSERT INTO pending_signups
    (
      name,
      email,
      password_hash,
      company_name,
      company_type,
      job_title,
      phone,
      branches,
      logo_url
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9)

    ON CONFLICT(email)
    DO UPDATE SET

      name=EXCLUDED.name,
      password_hash=EXCLUDED.password_hash,
      company_name=EXCLUDED.company_name,
      company_type=EXCLUDED.company_type,
      job_title=EXCLUDED.job_title,
      phone=EXCLUDED.phone,
      branches=EXCLUDED.branches,
      logo_url=EXCLUDED.logo_url,
      created_at=NOW()
    `,
    [
      name,
      normalizedEmail,
      passwordHash,
      companyName,
      companyType,
      jobTitle,
      phone,
      JSON.stringify(branches || []),
      logoUrl,
    ],
  );
};

export const deletePendingSignup = async (email) => {
  await pool.query(
    `
    DELETE FROM pending_signups
    WHERE email=$1
    `,
    [email],
  );
};
// ─── User Queries ────────────────────────────────────────────────────────────

export const findUserByEmail = async (email) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const { rows } = await pool.query(
    `SELECT u.*, c.name as company_name FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE LOWER(u.email) = LOWER($1)`,
    [normalizedEmail],
  );
  return rows[0] || null;
};

export const findUserById = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.company_id,
        u.profile_image_url,
        u.job_title,
        u.department,
        u.branch,
        u.phone,
        u.address,
        u.national_id,
        u.birth_date,
        u.employee_code,
        u.hire_date,
        u.is_active,
        u.is_verified,
        c.name AS company_name,
        c.logo_url AS company_logo,
        c.type AS company_type,
        c.departments AS company_departments,
        c.branches AS company_branches
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.id = $1`,
    [userId],
  );

  return rows[0] || null;
};

export const createUser = async ({
  companyId,
  name,
  email,
  passwordHash,
  role,
  jobTitle,
  phone,
  branch = null,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO users (company_id, name, email, password_hash, role, job_title, phone, branch, is_active, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false) RETURNING id, email, name`,
    [companyId, name, email, passwordHash, role, jobTitle, phone, branch],
  );
  return rows[0];
};

export const activateUser = async (userId) => {
  await pool.query(
    `UPDATE users SET is_active = true, is_verified = true WHERE id = $1`,
    [userId],
  );
};

export const updateInviteSentAt = async (userId) => {
  await pool.query("UPDATE users SET invite_sent_at = NOW() WHERE id = $1", [
    userId,
  ]);
};
export const acceptEmployeeInvite = async ({
  userId,
  passwordHash,
  profileImageUrl,
}) => {
  await pool.query(
    `
        UPDATE users
        SET
            password_hash=$1,
            profile_image_url=COALESCE($2,profile_image_url),
            is_active=true,
            is_verified=true,
            invite_accepted_at=NOW(),
            invite_token=uuid_generate_v4(),
            updated_at=NOW()
        WHERE id=$3
        `,
    [passwordHash, profileImageUrl, userId],
  );
};

export const acceptUserInvite = async ({
  userId,
  name,
  phone,
  passwordHash,
  profileImageUrl,
}) => {
  await pool.query(
    `UPDATE users
     SET
       name = COALESCE($1, name),
       phone = COALESCE($2, phone),
       password_hash = $3,
       profile_image_url = COALESCE($4, profile_image_url),
       is_active = true,
       is_verified = true,
       invite_accepted_at = NOW(),
       invite_token = uuid_generate_v4(),
       updated_at = NOW()
     WHERE id = $5`,
    [name, phone, passwordHash, profileImageUrl, userId]
  );
};
// ─── Company Queries ─────────────────────────────────────────────────────────
export const createCompany = async ({ name, type, branches, logoUrl }) => {
  const { rows } = await pool.query(
    `
    INSERT INTO companies
    (
      name,
      type,
      branches,
      logo_url
    )
    VALUES
    (
      $1,$2,$3,$4
    )
    RETURNING id
    `,
    [name, type, branches || [], logoUrl || null],
  );

  return rows[0].id;
};

export const registerManagerTransaction = async () => {
  throw new Error(
    "registerManagerTransaction is no longer used. Managers are created only after OTP verification.",
  );
};
export const completePendingSignupTransaction = async (email) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: pendingRows } = await client.query(
      `
      SELECT *
      FROM pending_signups
      WHERE email=$1
      `,
      [email],
    );

    if (!pendingRows.length) {
      throw Object.assign(new Error("Pending signup not found"), {
        statusCode: 404,
      });
    }

    const pending = pendingRows[0];

    const { rows: exists } = await client.query(
      `
      SELECT id
      FROM users
      WHERE email=$1
      `,
      [email],
    );

    if (exists.length) {
      throw Object.assign(new Error("Email already registered"), {
        statusCode: 409,
      });
    }

    const { rows: companyRows } = await client.query(
      `
      INSERT INTO companies
      (
        name,
        type,
        branches,
        logo_url
      )
      VALUES
      ($1,$2,$3,$4)
      RETURNING id
      `,
      [
        pending.company_name,
        pending.company_type,
        pending.branches,
        pending.logo_url,
      ],
    );

    const companyId = companyRows[0].id;

    const { rows: userRows } = await client.query(
      `
      INSERT INTO users
      (
        company_id,
        name,
        email,
        password_hash,
        role,
        job_title,
        phone,
        is_active,
        is_verified
      )
      VALUES
      (
        $1,$2,$3,$4,'manager',$5,$6,true,true
      )
      RETURNING *
      `,
      [
        companyId,
        pending.name,
        pending.email,
        pending.password_hash,
        pending.job_title,
        pending.phone,
      ],
    );

    await client.query(
      `
      DELETE FROM pending_signups
      WHERE email=$1
      `,
      [email],
    );

    await client.query("COMMIT");

    return userRows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
export const getCompanyById = async (companyId) => {
  const { rows } = await pool.query("SELECT * FROM companies WHERE id = $1", [
    companyId,
  ]);
  return rows[0] || null;
};

export const updateCompanyDepartments = async (companyId, departments) => {
  await pool.query(
    `UPDATE companies SET departments = $1, updated_at = NOW() WHERE id = $2`,
    [departments, companyId],
  );
};

export const inviteHRUser = async ({ companyId, email, branch }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (company_id, name, email, role, branch, is_active, is_verified, invite_sent_at)
     VALUES ($1, $2, $3, 'hr', $4, false, false, NOW())
     RETURNING id, email, invite_token`,
    [companyId, email, email, branch],
  );
  return rows[0];
};

export const findInviteByEmail = async (email) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.invite_token, u.is_verified, u.phone,
            c.name as company_name
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE LOWER(u.email) = LOWER($1) AND u.role IN ('hr', 'employee')`,
    [normalizedEmail],
  );
  return rows[0] || null;
};

// ─── OAuth Queries ───────────────────────────────────────────────────────────

export const findUserByOAuthId = async (provider, providerId) => {
  const field = provider === "google" ? "google_id" : "facebook_id";
  const { rows } = await pool.query(
    `SELECT u.*, c.name as company_name FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.${field} = $1`,
    [providerId],
  );
  return rows[0] || null;
};

export const linkOAuthToUser = async ({
  userId,
  provider,
  providerId,
  profilePicture,
}) => {
  const field = provider === "google" ? "google_id" : "facebook_id";
  await pool.query(
    `UPDATE users SET ${field} = $1, auth_provider = $2, 
     profile_image_url = COALESCE(profile_image_url, $3), updated_at = NOW()
     WHERE id = $4`,
    [providerId, provider, profilePicture, userId],
  );
};

export const createOAuthManager = async ({
  name,
  email,
  provider,
  providerId,
  companyId,
  jobTitle,
  phone,
}) => {
  const providerField = provider === "google" ? "google_id" : "facebook_id";
  const { rows } = await pool.query(
    `INSERT INTO users (company_id, name, email, role, job_title, phone, ${providerField}, auth_provider, is_active, is_verified)
     VALUES ($1, $2, $3, 'manager', $4, $5, $6, $7, true, true) RETURNING id, name, email, role, company_id`,
    [companyId, name, email, jobTitle, phone, providerId, provider],
  );
  return rows[0];
};

// ─── OTP Queries ─────────────────────────────────────────────────────────────

export const invalidateOTPs = async (email, purpose) => {
  await pool.query(
    `UPDATE otp_codes SET used_at = NOW() 
     WHERE email = $1 AND purpose = $2 AND used_at IS NULL`,
    [email, purpose],
  );
};

export const insertOTP = async ({
  userId,
  email,
  code,
  purpose,
  expiresAt,
}) => {
  await pool.query(
    `INSERT INTO otp_codes (user_id, email, code, purpose, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId || null, email, code, purpose, expiresAt],
  );
};

export const fetchActiveOTP = async (email, purpose) => {
  const { rows } = await pool.query(
    `SELECT * FROM otp_codes 
     WHERE email = $1 AND purpose = $2 AND used_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [email, purpose],
  );
  return rows[0] || null;
};

export const incrementOTPAttempts = async (otpId) => {
  await pool.query(
    `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`,
    [otpId],
  );
};

export const markOTPAsUsed = async (otpId) => {
  await pool.query(`UPDATE otp_codes SET used_at = NOW() WHERE id = $1`, [
    otpId,
  ]);
};

// ─── Refresh Token Queries ───────────────────────────────────────────────────

export const insertRefreshToken = async ({
  userId,
  tokenHash,
  expiresAt,
  ipAddress,
  userAgent,
}) => {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, ipAddress, userAgent],
  );
};

export const fetchActiveRefreshToken = async (tokenHash) => {
  const { rows } = await pool.query(
    `SELECT rt.*, u.id as user_id, u.role, u.company_id, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
    [tokenHash],
  );
  return rows[0] || null;
};

export const revokeRefreshToken = async (tokenHash) => {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
    [tokenHash],
  );
};

export const revokeAllUserTokens = async (userId) => {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
};

export const setupCompanyTransaction = async ({
  companyId,
  departments,
  hrInvites,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      UPDATE companies
      SET
        departments=$1,
        updated_at=NOW()
      WHERE id=$2
      `,
      [departments, companyId],
    );

    const invitedHRs = [];

    for (const hr of hrInvites) {
      const { email, branch } = hr;

      const { rows: existing } = await client.query(
        `
        SELECT id
        FROM users
        WHERE email=$1
        `,
        [email],
      );

      if (existing.length) {
        throw Object.assign(new Error(`HR email ${email} already exists.`), {
          statusCode: 409,
        });
      }

      const inviteToken = crypto.randomUUID();

      const { rows } = await client.query(
        `
        INSERT INTO users
        (
          company_id,
          name,
          email,
          role,
          branch,
          invite_token,
          invite_sent_at,
          is_active,
          is_verified
        )
        VALUES
        (
          $1,
          $2,
          $3,
          'hr',
          $4,
          $5,
          NOW(),
          false,
          false
        )
        RETURNING
        id,
        email,
        invite_token
        `,
        [companyId, email, email, branch, inviteToken],
      );

      invitedHRs.push(rows[0]);
    }

    await client.query("COMMIT");

    return invitedHRs;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
export const completeOAuthRegistrationTransaction = async ({
  name,
  email,
  provider,
  providerId,
  companyName,
  companyType,
  branches,
  jobTitle,
  phone,
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    if (existing.length > 0) {
      throw Object.assign(new Error("Email already registered"), {
        statusCode: 409,
      });
    }

    const { rows: companyRows } = await client.query(
      `INSERT INTO companies (name, type, branches) VALUES ($1, $2, $3) RETURNING id`,
      [companyName, companyType, branches || []],
    );
    const companyId = companyRows[0].id;

    const providerField = provider === "google" ? "google_id" : "facebook_id";
    const { rows: userRows } = await client.query(
      `INSERT INTO users (company_id, name, email, role, job_title, phone, ${providerField}, auth_provider, is_active, is_verified)
       VALUES ($1, $2, $3, 'manager', $4, $5, $6, $7, true, true) RETURNING id, name, email, role, company_id`,
      [companyId, name, email, jobTitle, phone, providerId, provider],
    );
    const user = userRows[0];

    await client.query("COMMIT");
    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
