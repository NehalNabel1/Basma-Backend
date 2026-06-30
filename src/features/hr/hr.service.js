import * as hrRepo from "./hr.repository.js";
import { sendHRInviteEmail } from "../../utils/email.js";
import logger from "../../utils/logger.js";

/**
 * Manager adds a new HR — sends invite email directly (no OTP)
 */
export const addHR = async ({
  email,
  branch,
  companyId,
  invitedById,
  companyName,
  inviterName,
}) => {
  const existing = await hrRepo.checkEmailExists(email);
  if (existing) {
    throw Object.assign(new Error("Email already registered in the system"), {
      statusCode: 409,
    });
  }

  // name is unknown until HR accepts — default to email, updated on acceptInvite
  const hrUser = await hrRepo.createHRUser({ companyId, email, branch });

  const inviteUrl = `${process.env.FRONTEND_URL}/auth/invite?token=${hrUser.invite_token}&email=${encodeURIComponent(email)}`;
  await sendHRInviteEmail({
    to: email,
    name: email,
    inviteUrl,
    companyName,
    inviterName,
  });

  logger.info(`HR invite sent: ${email} by ${invitedById}`);
  return hrUser;
};

/**
 * Get all HRs for a company
 */
export const getCompanyHRs = async (
  companyId,
  { page = 1, limit = 20, search } = {},
) => {
  const offset = (page - 1) * limit;

  const result = await hrRepo.getHRsList(companyId, {
    limit,
    offset,
    search,
  });

  return {
    hrs: result.hrs,
    pagination: {
      total: result.total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(result.total / limit),
    },
  };
};

/**
 * Resend HR invite
 */
export const resendHRInvite = async ({
  hrId,
  companyId,
  inviterName,
  companyName,
}) => {
  const hr = await hrRepo.findHRById(hrId);

  if (!hr) throw Object.assign(new Error("HR not found"), { statusCode: 404 });
  if (hr.company_id !== companyId)
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });
  if (hr.is_verified)
    throw Object.assign(new Error("HR has already activated their account"), {
      statusCode: 409,
    });

  const updatedHR = await hrRepo.rotateInviteToken(hrId);

  const inviteUrl = `${process.env.FRONTEND_URL}/auth/invite?token=${updatedHR.invite_token}&email=${encodeURIComponent(updatedHR.email)}`;
  await sendHRInviteEmail({
    to: updatedHR.email,
    name: updatedHR.name,
    inviteUrl,
    companyName,
    inviterName,
  });

  await hrRepo.updateInviteSentAt(hrId);
  return { email: updatedHR.email };
};

/**
 * Delete HR
 */
export const deleteHR = async (hrId, companyId) => {
  const hr = await hrRepo.findHRById(hrId);
  if (!hr) throw Object.assign(new Error("HR not found"), { statusCode: 404 });
  if (hr.company_id !== companyId)
    throw Object.assign(new Error("Access denied"), { statusCode: 403 });

  await hrRepo.deleteHRUser(hrId);
};
