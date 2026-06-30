import * as service from './departments.service.js';
import { success } from '../../utils/response.js';

export const getDepartments = async (req, res) => {
  const list = await service.listDepartments(req.user.company_id);
  return success(res, list);
};

export const addDepartment = async (req, res) => {
  const { name } = req.body;
  const list = await service.createDepartment(req.user.company_id, name);
  return success(res, list, 'Department added successfully');
};

export const deleteDepartment = async (req, res) => {
  const { name } = req.body;
  const list = await service.deleteDepartment(req.user.company_id, name);
  return success(res, list, 'Department removed successfully');
};
