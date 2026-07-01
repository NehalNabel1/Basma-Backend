import * as service from './branches.service.js';
import { success } from '../../utils/response.js';

export const getBranches = async (req, res) => {
  const list = await service.listBranches(req.user.company_id);
  return success(res, list);
};

export const addBranch= async (req, res) => {
  const { name } = req.body;
  const list = await service.createBranche(req.user.company_id, name);
  return success(res, list, 'Branch added successfully');
};

export const deleteBranch= async (req, res) => {
  const { name } = req.body;
  const list = await service.deleteBranch(req.user.company_id, name);
  return success(res, list, 'Branch removed successfully');
};
