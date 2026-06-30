import * as repo from './payroll.repository.js';

export const listPayrolls = async (userId) => {
  return repo.getPayrolls(userId);
};

export const generatePayroll = async (data) => {
  const net_salary = Number(data.basic_salary || 0) + Number(data.allowances || 0) - Number(data.deductions || 0);
  return repo.createPayroll({ ...data, net_salary });
};
