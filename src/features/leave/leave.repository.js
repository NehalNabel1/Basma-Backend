// Mock in-memory database for leaves
const leaves = [
  { id: '1', user_id: 'mock-user-1', type: 'sick', start_date: '2026-07-01', end_date: '2026-07-03', status: 'pending', reason: 'Flu' },
];

export const getLeaves = async (userId) => {
  return leaves.filter((l) => !userId || l.user_id === userId);
};

export const createLeave = async (data) => {
  const newLeave = { id: String(leaves.length + 1), status: 'pending', ...data };
  leaves.push(newLeave);
  return newLeave;
};

export const updateLeaveStatus = async (leaveId, status) => {
  const leaf = leaves.find((l) => l.id === leaveId);
  if (leaf) leaf.status = status;
  return leaf || null;
};
