import bcrypt from "bcryptjs";
import * as authRepo from "./auth.repository.js";
import { saveOTP, verifyOTP } from "../../utils/otp.js";
import {
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
} from "../../utils/jwt.js";
import logger from "../../utils/logger.js";
import { sendOTPEmail, sendHRInviteEmail } from "../../utils/email.js";

// ─── Signup ─────────────────────────────
export const registerManager = async ({
  name,
  email,
  password,
  company_name,
  company_type,
  branches,
  job_title,
  phone,
  logo_url,
}) => {
  const exists = await authRepo.findUserByEmail(email);

  if (exists) {
    throw Object.assign(new Error("Email already registered"), {
      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await authRepo.createPendingSignup({
    name,
    email,
    passwordHash,
    companyName: company_name,
    companyType: company_type,
    jobTitle: job_title,
    phone,
    branches,
    logoUrl: logo_url,
  });

  const otp = await saveOTP(email, null, "signup");

  await sendOTPEmail({
    to: email,
    name,
    otp,
  });

  logger.info(`Pending manager signup: ${email}`);

  return {
    email,
  };
};

// ─── Verify Manager Signup OTP ────────────────────────────────────────────────
export const verifyManagerOTP = async ({ email, otp }, req) => {
  const pending = await authRepo.findPendingSignup(email);

  if (!pending) {
    throw Object.assign(new Error("Pending signup not found"), {
      statusCode: 404,
    });
  }

  await verifyOTP(email, otp, "signup");

  const user = await authRepo.completePendingSignupTransaction(email);

  const accessToken = generateAccessToken({
    sub: user.id,
    role: user.role,
    company: user.company_id,
  });

  const refreshToken = generateRefreshToken();

  await saveRefreshToken(user.id, refreshToken, req);

  logger.info(`Manager verified: ${email}`);

  return {
    accessToken,
    refreshToken,
    user,
  };
};

export const verifyLoginOTP = async ({ email, otp }, req) => {
  const user = await authRepo.findUserByEmail(email);

  if (!user) {
    throw Object.assign(new Error("User not found"), {
      statusCode: 404,
    });
  }

  await verifyOTP(email, otp, "login");

  const accessToken = generateAccessToken({
    sub: user.id,
    role: user.role,
    company: user.company_id,
  });

  const refreshToken = generateRefreshToken();

  await saveRefreshToken(user.id, refreshToken, req);

  return {
    accessToken,
    refreshToken,
    user,
  };
};
// ─── Login ───────────────────────────────
export const loginWithPassword = async ({ email, password }, req) => {
  const user = await authRepo.findUserByEmail(email);

  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), {
      statusCode: 401,
    });
  }

  if (!user.password_hash) {
    throw Object.assign(
      new Error("Please accept your invitation before logging in."),
      {
        statusCode: 403,
      },
    );
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    throw Object.assign(new Error("Invalid credentials"), {
      statusCode: 401,
    });
  }

  const accessToken = generateAccessToken({
    sub: user.id,
    role: user.role,
    company: user.company_id,
  });

  const refreshToken = generateRefreshToken();

  await saveRefreshToken(user.id, refreshToken, req);

  return {
    accessToken,
    refreshToken,
    user,
  };
};

// ─── Resend OTP ─────────────────────────
export const resendOTP = async ({ email }) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  const pending = await authRepo.findPendingSignup(normalizedEmail);

  if (pending) {
    const otp = await saveOTP(normalizedEmail, null, "signup");

    await sendOTPEmail({
      to: normalizedEmail,
      name: pending.name,
      otp,
      purpose: "signup",
    });

    return;
  }

  const user = await authRepo.findUserByEmail(normalizedEmail);

  if (!user) {
    throw Object.assign(new Error("User not found"), {
      statusCode: 404,
    });
  }

  if (user.is_active && user.is_verified) {
    throw Object.assign(
      new Error(
        "This account is already verified. Please sign in with your password.",
      ),
      {
        statusCode: 409,
      },
    );
  }

  throw Object.assign(
    new Error(
      "Your account is not fully active yet. Please complete signup or contact support.",
    ),
    {
      statusCode: 400,
    },
  );
};

// ─── Tokens ──────────────────────────────
export const issueTokens = async (user, req) => {
  const accessToken = generateAccessToken({
    sub: user.id,
    role: user.role,
    company: user.company_id,
  });

  const refreshToken = generateRefreshToken();

  await saveRefreshToken(user.id, refreshToken, req);

  return { accessToken, refreshToken };
};
// ─── Manager Signup Step 2 ────────────────────────────────────────────────────
export const setupCompany = async ({ managerId, departments, hr_invites }) => {
  console.log("Repository received hrInvites:", hr_invites);
  const manager = await authRepo.findUserById(managerId);

  if (!manager || manager.role !== "manager") {
    throw Object.assign(new Error("Manager not found"), {
      statusCode: 404,
    });
  }

  const companyId = manager.company_id;
  const companyName = manager.company_name;

  // Save departments and create HR accounts
  const invitedHRs = await authRepo.setupCompanyTransaction({
    companyId,
    departments,
    hrInvites: hr_invites || [],
  });

  // Send invitation emails
  for (const hr of invitedHRs) {
    const inviteUrl = `${process.env.FRONTEND_URL}/auth/invite?token=${hr.invite_token}&email=${encodeURIComponent(hr.email)}`;

    await sendHRInviteEmail({
      to: hr.email,
      name: hr.email,
      inviteUrl,
      companyName,
      inviterName: manager.name,
    });

    logger.info(`HR invited: ${hr.email}`);
  }

  return {
    company_id: companyId,
    departments,
    invited_hrs: invitedHRs.map((h) => ({
      id: h.id,
      email: h.email,
    })),
  };
};
// ─── Validate Invite Token ───────────────────────────────────────────
export const validateInviteToken = async ({ email, token }) => {
  const user = await authRepo.findInviteByEmail(email);

  if (!user) {
    throw Object.assign(new Error("Invite not found"), {
      statusCode: 404,
    });
  }

  if (user.invite_token !== token) {
    throw Object.assign(new Error("Invalid or expired invite link"), {
      statusCode: 400,
    });
  }

  if (user.is_verified) {
    throw Object.assign(
      new Error("This account has already been activated. Please log in."),
      { statusCode: 409 },
    );
  }

  return {
    email: user.email,
    role: user.role,
    company_name: user.company_name,
  };
};

export const acceptHRInvite = async ({
  email,
  token,
  name,
  phone,
  password,
  profile_image_url,
}) => {
  const user = await authRepo.findInviteByEmail(email);

  if (!user) {
    throw Object.assign(new Error("Invite not found"), {
      statusCode: 404,
    });
  }

  if (user.role !== "hr") {
    throw Object.assign(new Error("Invalid invite"), {
      statusCode: 400,
    });
  }

  if (user.invite_token !== token) {
    throw Object.assign(new Error("Invalid invite token"), {
      statusCode: 400,
    });
  }

  if (user.is_verified) {
    throw Object.assign(new Error("Account already activated"), {
      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await authRepo.acceptUserInvite({
    userId: user.id,
    name,
    phone,
    passwordHash,
    profileImageUrl: profile_image_url || null,
  });

  logger.info(`HR activated: ${email}`);
};
export const acceptEmployeeInvite = async ({
  email,
  token,
  password,
  profile_image_url,
}) => {
  const user = await authRepo.findInviteByEmail(email);

  if (!user) {
    throw Object.assign(new Error("Invite not found"), {
      statusCode: 404,
    });
  }

  if (user.role !== "employee") {
    throw Object.assign(new Error("Invalid invite"), {
      statusCode: 400,
    });
  }

  if (user.invite_token !== token) {
    throw Object.assign(new Error("Invalid invite token"), {
      statusCode: 400,
    });
  }

  if (user.is_verified) {
    throw Object.assign(new Error("Account already activated"), {
      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await authRepo.acceptUserInvite({
    userId: user.id,
    name: user.name,
    phone: user.phone,
    passwordHash,
    profileImageUrl: profile_image_url || null,
  });

  logger.info(`Employee activated: ${email}`);
};

export const handleOAuthLogin = async (user, req) => {
  const provider = user?.provider;
  const providerId = user?.oauthProfile?.id || user?.id;
  const email = user?.email;

  if (!provider || !providerId || !email) {
    throw Object.assign(new Error("Incomplete OAuth profile"), {
      statusCode: 400,
    });
  }

  const existingByProvider = await authRepo.findUserByOAuthId(
    provider,
    providerId,
  );

  if (existingByProvider) {
    const { accessToken, refreshToken } = await issueTokens(
      existingByProvider,
      req,
    );
    return {
      type: "login",
      accessToken,
      refreshToken,
    };
  }

  const existingByEmail = await authRepo.findUserByEmail(email);

  if (existingByEmail) {
    await authRepo.linkOAuthToUser({
      userId: existingByEmail.id,
      provider,
      providerId,
      profilePicture: user?.oauthProfile?.photos?.[0]?.value || null,
    });

    const { accessToken, refreshToken } = await issueTokens(
      existingByEmail,
      req,
    );
    return {
      type: "login",
      accessToken,
      refreshToken,
    };
  }

  return {
    type: "register",
    profile: {
      email,
      name: user?.name || user?.displayName || email,
      provider,
      provider_id: providerId,
      profile_image_url: user?.oauthProfile?.photos?.[0]?.value || null,
    },
  };
};

export const completeOAuthRegistration = async ({
  name,
  email,
  provider,
  provider_id,
  company_name,
  company_type,
  branches,
  job_title,
  phone,
}) => {
  const user = await authRepo.completeOAuthRegistrationTransaction({
    name,
    email,
    provider,
    providerId: provider_id,
    companyName: company_name,
    companyType: company_type,
    branches,
    jobTitle: job_title,
    phone,
  });

  return user;
};
