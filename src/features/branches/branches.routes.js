import express from 'express';
import * as ctrl from './branches.controller.js';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { branchValidator } from './branches.validator.js';

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getBranches);
router.post('/', authorize('manager', 'hr'), branchValidator, validate, ctrl.addBranch);
router.delete('/', authorize('manager', 'hr'), branchValidator, validate, ctrl.deleteBranch);

export default router;