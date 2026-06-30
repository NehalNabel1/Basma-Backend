import express from 'express';
import * as ctrl from './hr.controller.js';
import { protect, authorize } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { inviteLimiter } from '../../middleware/rateLimiter.middleware.js';
import { addHRValidator } from './hr.validator.js';

const router = express.Router();

// All HR routes require manager auth
router.use(protect, authorize('manager'));

router.post('/', inviteLimiter, addHRValidator, validate, ctrl.addHR);
router.get('/', ctrl.getHRs);
router.post('/:id/resend-invite', inviteLimiter, ctrl.resendInvite);
router.delete('/:id', ctrl.deleteHR);

export default router;
