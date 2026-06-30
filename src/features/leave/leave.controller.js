import * as service from './leave.service.js';
import { success, badRequest } from '../../utils/response.js';

export const getLeaves = async (req, res) => {
  const { user_id } = req.query;
  const list = await service.listLeaves(user_id);
  return success(res, list);
};

export const applyLeave = async (req, res) => {
  const record = await service.requestLeave({
    user_id: req.user.id,
    ...req.body,
  });
  return success(res, record, 'Leave application submitted successfully');
};

export const approveRejectLeave = async (req, res) => {
  const { status } = req.body;
  const record = await service.updateStatus(req.params.id, status);
  if (!record) return badRequest(res, 'Leave request not found');
  return success(res, record, `Leave request ${status} successfully`);
};
