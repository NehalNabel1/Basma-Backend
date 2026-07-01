import * as repo from './branches.repository.js';

export const listBranches = async (companyId) => {
  return repo.getCompanyBranches(companyId);
};

export const createBranch = async (companyId, branchName) => {
  return repo.addCompanyBranches(companyId, branchName);
};

export const deleteBranch = async (companyId, branchName) => {
  return repo.removeCompanyBranch(companyId, branchName);
};