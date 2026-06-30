import { body } from 'express-validator';

export const departmentValidator = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
];

export default { departmentValidator };
