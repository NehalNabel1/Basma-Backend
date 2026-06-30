import * as service from './payroll.service.js';
import { success } from '../../utils/response.js';

export const getPayrolls = async (req, res) => {
  const { user_id } = req.query;
  const list = await service.listPayrolls(user_id);
  return success(res, list);
};

export const generatePayroll = async (req, res) => {
  const data = await service.generatePayroll(req.body);
  return success(res, data, 'Payroll generated successfully');
};
