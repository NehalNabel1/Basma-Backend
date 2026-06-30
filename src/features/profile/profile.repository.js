import { pool } from '../../config/database.js';

export const findProfileById = async (userId) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.company_id, u.phone, u.address,
            u.national_id, u.birth_date, u.profile_image_url, u.job_title,
            u.department, u.branch, u.employee_code, u.hire_date, u.employment_type,
            u.direct_manager, u.auth_provider, u.created_at,
            c.name    AS company_name,
            c.type    AS company_type,
            c.logo_url AS company_logo,
            c.branches AS company_branches,
            c.departments AS company_departments
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.id = $1`,
    [userId]
  );
  return rows[0] || null;
};

export const findPasswordHash = async (userId) => {
  const { rows } = await pool.query(
    'SELECT password_hash, auth_provider FROM users WHERE id = $1',
    [userId]
  );
  return rows[0] || null;
};

export const updateUserFields = async (userId, setClauses, params) => {
  await pool.query(
    `UPDATE users SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${params.length + 1}`,
    [...params, userId]
  );
};

export const updatePasswordHash = async (userId, password_hash) => {
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [password_hash, userId]
  );
};

export const updateCompanyFields = async (companyId, setClauses, params) => {
  await pool.query(
    `UPDATE companies SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${params.length + 1}`,
    [...params, companyId]
  );
};