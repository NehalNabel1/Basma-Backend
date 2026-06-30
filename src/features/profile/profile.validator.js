import { body } from 'express-validator';

export const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('address').optional().trim().isLength({ max: 500 }),
  body('birth_date').optional().isISO8601().withMessage('Invalid date format (YYYY-MM-DD)'),
];

export const changePasswordValidator = [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
  body('confirm_password').custom((val, { req }) => {
    if (val !== req.body.new_password) throw new Error('Passwords do not match');
    return true;
  }),
];

export const updateCompanyValidator = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Company name too short'),
  body('type').optional().trim().notEmpty(),
  body('branches').optional().isArray().withMessage('Branches must be an array'),
  body('departments').optional().isArray().withMessage('Departments must be an array'),
];

export default { updateProfileValidator, changePasswordValidator, updateCompanyValidator };