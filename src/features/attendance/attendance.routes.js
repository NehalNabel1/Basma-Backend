import express from 'express';
import * as ctrl from './attendance.controller.js';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { logAttendanceValidator } from './attendance.validator.js';

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getAttendance);
router.post('/', logAttendanceValidator, validate, ctrl.logAttendance);

export default router;
