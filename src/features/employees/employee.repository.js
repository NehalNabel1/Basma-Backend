import { pool } from "../../config/database.js";

export const findUserByEmail = async (email) => {
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

const getUniqueEmployeeCode = async (client) => {
  let code;
  let exists = true;
  while (exists) {
    code = generateEmployeeCode();
    const { rows } = await client.query(
      "SELECT 1 FROM users WHERE employee_code = $1",
      [code],
    );
    exists = rows.length > 0;
  }
  return code;
};

export const createEmployeeInTransaction = async ({
  companyId,
  name,
  email,
  phone,
  address,
  national_id,
  birth_date,
  job_title,
  department,
  branch,
  direct_manager,
  employment_type,
  hire_date,
  documents,
  addedById,
}) => {
  const client = await pool.connect();
  try {
   
    await client.query("BEGIN");
    const employeeCode = await getUniqueEmployeeCode(client);
    const { rows } = await client.query(
      `INSERT INTO users (
    company_id, name, email, role, phone, address, national_id, birth_date,
    job_title, department, branch, direct_manager, employment_type,
    hire_date, employee_code, is_active, is_verified, invite_sent_at
  ) VALUES ($1,$2,$3,'employee',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false,false,NOW())
  RETURNING id, name, email, invite_token, employee_code`,
      [
        companyId,
        name,
        email,
        phone,
        address,
        national_id || null,
        birth_date || null,
        job_title,
        department || null,
        branch,
        direct_manager || null,
        employment_type,
        hire_date,
        employeeCode,
      ],
    );
    const employee = rows[0];

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        await client.query(
          `INSERT INTO employee_documents (user_id, file_name, file_url, file_size, mime_type, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            employee.id,
            doc.filename,
            doc.url,
            doc.size,
            doc.mimetype,
            addedById,
          ],
        );
      }
    }

    await client.query("COMMIT");
    return employee;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getEmployeesList = async (
  companyId,
  { limit, offset, search, department, branch },
) => {
  const conditions = [`u.company_id = $1`, `u.role = 'employee'`];
  const params = [companyId];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.employee_code ILIKE $${params.length})`,
    );
  }
  if (department) {
    params.push(department);
    conditions.push(`u.department = $${params.length}`);
  }
  if (branch) {
    params.push(branch);
    conditions.push(`u.branch = $${params.length}`);
  }

  const where = conditions.join(" AND ");

  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.job_title, u.department, u.branch,
            u.employee_code, u.hire_date, u.employment_type, u.is_active, u.is_verified,
            u.profile_image_url, u.direct_manager, u.created_at
     FROM users u
     WHERE ${where}
     ORDER BY u.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*) FROM users u WHERE ${where}`,
    params,
  );

  return {
    employees: rows,
    total: parseInt(countRows[0].count),
  };
};

export const getEmployeeById = async (employeeId, companyId) => {
  const { rows } = await pool.query(
    `SELECT u.*,
            COALESCE(json_agg(json_build_object(
              'id', ed.id, 'file_name', ed.file_name, 'file_url', ed.file_url,
              'file_size', ed.file_size, 'mime_type', ed.mime_type, 'created_at', ed.created_at
            )) FILTER (WHERE ed.id IS NOT NULL), '[]') as documents
     FROM users u
     LEFT JOIN employee_documents ed ON ed.user_id = u.id
     WHERE u.id = $1 AND u.company_id = $2 AND u.role = 'employee'
     GROUP BY u.id`,
    [employeeId, companyId],
  );
  return rows[0] || null;
};

export const checkEmployeeExists = async (employeeId) => {
  const { rows } = await pool.query(
    `SELECT id, company_id FROM users WHERE id = $1 AND role = 'employee'`,
    [employeeId],
  );
  return rows[0] || null;
};

export const updateEmployeeFields = async (employeeId, setClauses, params) => {
  await pool.query(
    `UPDATE users SET ${setClauses.join(", ")}, updated_at = NOW() WHERE id = $${params.length}`,
    params,
  );
};

export const insertEmployeeDocument = async ({
  employeeId,
  filename,
  url,
  size,
  mimetype,
}) => {
  await pool.query(
    `INSERT INTO employee_documents (user_id, file_name, file_url, file_size, mime_type)
     VALUES ($1, $2, $3, $4, $5)`,
    [employeeId, filename, url, size, mimetype],
  );
};

export const findDocumentById = async (docId) => {
  const { rows } = await pool.query(
    `SELECT ed.*, u.company_id FROM employee_documents ed
     JOIN users u ON u.id = ed.user_id WHERE ed.id = $1`,
    [docId],
  );
  return rows[0] || null;
};

export const deleteDocumentById = async (docId) => {
  await pool.query("DELETE FROM employee_documents WHERE id = $1", [docId]);
};

export const updateEmployeeStatus = async (employeeId, is_active) => {
  await pool.query(
    "UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2",
    [is_active, employeeId],
  );
};

export const rotateInviteToken = async (employeeId) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET invite_token = uuid_generate_v4(), updated_at = NOW()
     WHERE id = $1
     RETURNING id, email, name, invite_token`,
    [employeeId],
  );
  return rows[0];
};

export const updateInviteSentAt = async (employeeId) => {
  await pool.query("UPDATE users SET invite_sent_at = NOW() WHERE id = $1", [
    employeeId,
  ]);
};
export const deleteEmployeeById = async (employeeId) => {
  await pool.query("DELETE FROM users WHERE id = $1", [employeeId]);
};
const generateEmployeeCode = () => {
  const digits = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `SW${digits}`;
};
