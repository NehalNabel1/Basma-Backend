import express from 'express';
import * as ctrl from './departments.controller.js';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { departmentValidator } from './departments.validator.js';

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getDepartments);
router.post('/', authorize('manager', 'hr'), departmentValidator, validate, ctrl.addDepartment);
router.delete('/', authorize('manager', 'hr'), departmentValidator, validate, ctrl.deleteDepartment);

export default router;
