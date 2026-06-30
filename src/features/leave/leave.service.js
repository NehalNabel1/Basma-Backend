import * as repo from './leave.repository.js';

export const listLeaves = async (userId) => {
  return repo.getLeaves(userId);
};

export const requestLeave = async (data) => {
  return repo.createLeave(data);
};

export const updateStatus = async (leaveId, status) => {
  return repo.updateLeaveStatus(leaveId, status);
};
