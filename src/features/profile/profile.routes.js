import express from 'express';
import * as ctrl from './profile.controller.js';
import { protect } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { uploadProfileImage } from '../../utils/upload.js';
import {
  updateProfileValidator,
  changePasswordValidator,
  updateCompanyValidator,
} from './profile.validator.js';

const router = express.Router();

router.use(protect);

router.get('/', ctrl.getProfile);
router.put('/', uploadProfileImage, updateProfileValidator, validate, ctrl.updateProfile);
router.put('/change-password', changePasswordValidator, validate, ctrl.changePassword);
router.put('/company', updateCompanyValidator, validate, ctrl.updateCompany);

export default router;
