import { pool } from '../../config/database.js';

export const getCompanyBranches = async (companyId) => {
  const { rows } = await pool.query(
    'SELECT branches FROM companies WHERE id = $1',
    [companyId]
  );
  return rows[0]?.branches || [];
};

export const addCompanyBranches = async (companyId, branchName) => {
  const { rows } = await pool.query(
    `UPDATE companies 
     SET branches = array_append(COALESCE(branches, '{}'::text[]), $1), 
         updated_at = NOW() 
     WHERE id = $2 
     RETURNING branches`,
    [branchName, companyId]
  );
  return rows[0]?.branches || [];
};

export const removeCompanyBranch = async (companyId, branchName) => {
  const { rows } = await pool.query(
    `UPDATE companies 
     SET branches = array_remove(branches, $1), 
         updated_at = NOW() 
     WHERE id = $2 
     RETURNING branches`,
    [branchName, companyId]
  );
  return rows[0]?.branches || [];
};