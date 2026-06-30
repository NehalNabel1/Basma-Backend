import * as repo from './attendance.repository.js';

export const listAttendance = async (userId) => {
  return repo.getAttendance(userId);
};

export const logAttendance = async (data) => {
  return repo.createAttendance(data);
};
