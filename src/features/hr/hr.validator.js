import { body } from 'express-validator';

export const addHRValidator = [
  body('email')
    .isEmail()
    .withMessage('Valid email required'),
  body('branch')
    .trim()
    .notEmpty()
    .withMessage('Branch is required'),
];
