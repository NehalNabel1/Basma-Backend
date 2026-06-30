import { body } from 'express-validator';

export const createPayrollValidator = [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('basic_salary').isNumeric().withMessage('Basic salary must be a number'),
  body('allowances').optional().isNumeric(),
  body('deductions').optional().isNumeric(),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),
];

export default { createPayrollValidator };
