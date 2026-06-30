import { pool } from "../../config/database.js";

export const checkEmailExists = async (email) => {
  const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  return rows[0] || null;
};

export const getCompanyName = async (companyId) => {
  const { rows } = await pool.query(
    "SELECT name FROM companies WHERE id = $1",
    [companyId],
  );
  return rows[0]?.name || null;
};

export const createHRUser = async ({ companyId, email, branch }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (company_id, name, email, role, branch, is_active, is_verified, invite_sent_at)
     VALUES ($1, $2, $3, 'hr', $4, false, false, NOW())
     RETURNING id, name, email, branch, invite_token`,
    [companyId, email, email, branch],
  );
  return rows[0];
};

export const getHRsList = async (companyId, { limit, offset, search }) => {
  const params = [companyId, limit, offset];
  let whereClause = `WHERE u.company_id = $1 AND u.role = 'hr'`;

  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND (u.name ILIKE $4 OR u.email ILIKE $4)`;
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.branch, u.is_active, u.is_verified,
            u.profile_image_url, u.phone, u.created_at, u.invite_sent_at, u.invite_accepted_at
     FROM users u
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $2 OFFSET $3`,
    params,
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM users WHERE company_id = $1 AND role = 'hr'`,
    [companyId],
  );

  return {
    hrs: rows,
    total: parseInt(countRows[0].count),
  };
};

export const findHRById = async (hrId) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, invite_token, is_verified, company_id
     FROM users WHERE id = $1 AND role = 'hr'`,
    [hrId],
  );
  return rows[0] || null;
};

export const updateInviteSentAt = async (hrId) => {
  await pool.query("UPDATE users SET invite_sent_at = NOW() WHERE id = $1", [
    hrId,
  ]);
};

export const rotateInviteToken = async (hrId) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET invite_token = uuid_generate_v4(), updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, name, invite_token`,
    [hrId],
  );
  return rows[0];
};

export const deleteHRUser = async (hrId) => {
  await pool.query("DELETE FROM users WHERE id = $1", [hrId]);
};
