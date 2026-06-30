import { body } from 'express-validator';

export const logAttendanceValidator = [
  body('status').isIn(['present', 'absent', 'late', 'leave']).withMessage('Invalid status'),
  body('check_in').optional().trim(),
  body('check_out').optional().trim(),
];

export default { logAttendanceValidator };
