import express from 'express';
import * as ctrl from './payroll.controller.js';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createPayrollValidator } from './payroll.validator.js';

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getPayrolls);
router.post('/', authorize('manager', 'hr'), createPayrollValidator, validate, ctrl.generatePayroll);

export default router;
