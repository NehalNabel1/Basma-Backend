import bcrypt from 'bcryptjs';
import * as repo from './profile.repository.js';

export const getProfile = async (userId) => {
  const profile = await repo.findProfileById(userId);
  if (!profile) throw Object.assign(new Error('Profile not found'), { statusCode: 404 });
  return profile;
};

export const updateProfile = async (userId, updates) => {
  const allowed = ['name', 'phone', 'address', 'birth_date', 'profile_image_url'];
  const setClauses = [];
  const params = [];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      params.push(updates[field]);
      setClauses.push(`${field} = $${params.length}`);
    }
  }

  if (setClauses.length === 0) return;
  await repo.updateUserFields(userId, setClauses, params);
};

export const changePassword = async (userId, { current_password, new_password }) => {
  const record = await repo.findPasswordHash(userId);
  if (!record) throw Object.assign(new Error('User not found'), { statusCode: 404 });

  if (record.auth_provider !== 'local' || !record.password_hash) {
    throw Object.assign(new Error('Social login accounts cannot change password here'), { statusCode: 400 });
  }

  const isMatch = await bcrypt.compare(current_password, record.password_hash);
  if (!isMatch) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });

  const newHash = await bcrypt.hash(new_password, 12);
  await repo.updatePasswordHash(userId, newHash);
};

export const updateCompany = async (companyId, updates) => {
  const allowed = ['name', 'type', 'branches', 'departments'];
  const setClauses = [];
  const params = [];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      params.push(updates[field]);
      setClauses.push(`${field} = $${params.length}`);
    }
  }

  if (setClauses.length === 0) return;
  await repo.updateCompanyFields(companyId, setClauses, params);
};