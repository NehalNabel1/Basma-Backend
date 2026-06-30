import { pool } from '../../config/database.js';

export const getCompanyDepartments = async (companyId) => {
  const { rows } = await pool.query('SELECT departments FROM companies WHERE id = $1', [companyId]);
  return rows[0]?.departments || [];
};

export const addCompanyDepartment = async (companyId, departmentName) => {
  const { rows } = await pool.query(
    `UPDATE companies 
     SET departments = array_append(COALESCE(departments, '{}'::text[]), $1), 
         updated_at = NOW() 
     WHERE id = $2 
     RETURNING departments`,
    [departmentName, companyId]
  );
  return rows[0]?.departments || [];
};

export const removeCompanyDepartment = async (companyId, departmentName) => {
  const { rows } = await pool.query(
    `UPDATE companies 
     SET departments = array_remove(departments, $1), 
         updated_at = NOW() 
     WHERE id = $2 
     RETURNING departments`,
    [departmentName, companyId]
  );
  return rows[0]?.departments || [];
};
