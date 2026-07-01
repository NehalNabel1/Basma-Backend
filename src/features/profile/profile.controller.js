import * as profileService from './profile.service.js';
import { success } from '../../utils/response.js';
import { processProfileImage } from '../../utils/upload.js';

export const getProfile = async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  return success(res, profile);
};

export const updateProfile = async (req, res) => {
  const updates = { ...req.body };

  if (req.file) {
    updates.profile_image_url = await processProfileImage(req.file.buffer);
  }

  await profileService.updateProfile(req.user.id, updates);
  return success(res, {}, 'Profile updated successfully');
};

export const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  await profileService.changePassword(req.user.id, { current_password, new_password });
  return success(res, {}, 'Password changed successfully');
};

export const updateCompany = async (req, res) => {
  if (req.user.role !== 'manager') {
    throw Object.assign(new Error('Only managers can update company info'), { statusCode: 403 });
  }
  await profileService.updateCompany(req.user.company_id, req.body);
  return success(res, {}, 'Company updated successfully');
};

//for employee
export const updateMyProfileImage = async (req, res) => {
  if (!req.file) {
    throw Object.assign(new Error("Profile image file is required"), { statusCode: 400 });
  }
  const url = await processProfileImage(req.file.buffer);
  
  await profileService.updateProfileImage(req.user.id, url);
  return success(res, { profile_image_url: url }, "Profile image updated");
};