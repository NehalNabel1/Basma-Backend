import { body } from 'express-validator';

export const addEmployeeValidator = [
  // Required fields
  body('name').trim().notEmpty().withMessage('Employee name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isMobilePhone(),
  body('address').trim().notEmpty().withMessage('Address is required'),

  // Optional personal
  body('national_id').optional().trim(),
  body('birth_date').optional().isISO8601().withMessage('Invalid birth date format (YYYY-MM-DD)'),
  body('email').isEmail().withMessage('Valid email is required'),

  // Required work fields
  body('job_title').trim().notEmpty().withMessage('Job title is required'),
  body('branch').trim().notEmpty().withMessage('Branch is required'),
  body('hire_date').notEmpty().withMessage('Hire date is required').isISO8601(),
  body('employment_type').trim().notEmpty().withMessage('Employment type is required'),

  // Optional work
  body('department').optional().trim(),
  body('direct_manager').optional().trim(),
];

export const updateEmployeeValidator = [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('birth_date').optional().isISO8601(),
  body('job_title').optional().trim(),
  body('department').optional().trim(),
  body('branch').optional().trim(),
  body('hire_date').optional().isISO8601(),
];

export default { addEmployeeValidator, updateEmployeeValidator };
