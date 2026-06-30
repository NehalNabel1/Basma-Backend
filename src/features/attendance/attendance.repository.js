// Mock in-memory database for attendance
const records = [
  { id: '1', user_id: 'mock-user-1', date: '2026-06-28', status: 'present', check_in: '09:00', check_out: '17:00' },
  { id: '2', user_id: 'mock-user-2', date: '2026-06-28', status: 'absent', check_in: null, check_out: null },
];

export const getAttendance = async (userId) => {
  return records.filter((r) => !userId || r.user_id === userId);
};

export const createAttendance = async (data) => {
  const newRecord = { id: String(records.length + 1), ...data };
  records.push(newRecord);
  return newRecord;
};
