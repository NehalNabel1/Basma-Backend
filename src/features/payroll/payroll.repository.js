// Mock in-memory database for payroll
const payrolls = [
  { id: '1', user_id: 'mock-user-1', basic_salary: 5000, allowances: 500, deductions: 200, net_salary: 5300, month: '2026-06' },
  { id: '2', user_id: 'mock-user-2', basic_salary: 6000, allowances: 600, deductions: 300, net_salary: 6300, month: '2026-06' },
];

export const getPayrolls = async (userId) => {
  return payrolls.filter((p) => !userId || p.user_id === userId);
};

export const createPayroll = async (data) => {
  const newPayroll = { id: String(payrolls.length + 1), ...data };
  payrolls.push(newPayroll);
  return newPayroll;
};
