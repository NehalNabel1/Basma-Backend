import * as repo from './departments.repository.js';

export const listDepartments = async (companyId) => {
  return repo.getCompanyDepartments(companyId);
};

export const createDepartment = async (companyId, departmentName) => {
  return repo.addCompanyDepartment(companyId, departmentName);
};

export const deleteDepartment = async (companyId, departmentName) => {
  return repo.removeCompanyDepartment(companyId, departmentName);
};
