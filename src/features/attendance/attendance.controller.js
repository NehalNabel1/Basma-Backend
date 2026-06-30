import * as service from './attendance.service.js';
import { success } from '../../utils/response.js';

export const getAttendance = async (req, res) => {
  const { user_id } = req.query;
  const list = await service.listAttendance(user_id);
  return success(res, list);
};

export const logAttendance = async (req, res) => {
  const record = await service.logAttendance({
    user_id: req.user.id,
    date: new Date().toISOString().split('T')[0],
    ...req.body,
  });
  return success(res, record, 'Attendance logged successfully');
};
