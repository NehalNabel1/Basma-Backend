import passport from "passport";
import * as authService from "./auth.service.js";
import * as authRepo from "./auth.repository.js";
import {
  verifyRefreshToken,
  revokeRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  saveRefreshToken,
} from "../../utils/jwt.js";
import { success, created, badRequest } from "../../utils/response.js";
import { processProfileImage, processLogoImage } from "../../utils/upload.js";
import logger from "../../utils/logger.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const setTokenCookie = (res, refreshToken) =>
  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

// ─── Manager Signup Step 1: personal + company info ──────────────────────────
export const managerSignup = async (req, res) => {
  const {
    name,
    email,
    password,
    company_name,
    company_type,
    branches,
    job_title,
    phone,
  } = req.body;

  let logo_url = null;
  if (req.file) logo_url = await processLogoImage(req.file.buffer);

  const result = await authService.registerManager({
    name,
    email,
    password,
    company_name,
    company_type,
    branches:
      typeof branches === "string" ? JSON.parse(branches) : branches || [],
    job_title,
    phone,
    logo_url,
  });

  return created(
    res,
    { email: result.email },
    "Account created. Check your email for the OTP verification code.",
  );
};

// ─── VERIFY SIGNUP OTP (UPDATED) ─────────────────────────────────────────────
export const verifySignupOTP = async (req, res) => {
  const { email, otp } = req.body;

  const { accessToken, refreshToken, user } =
    await authService.verifyManagerOTP({ email, otp }, req);

  setTokenCookie(res, refreshToken);

  return success(
    res,
    {
      accessToken,
      user,
    },
    "Email verified. Please complete your company setup.",
  );
};

// ─── Manager Signup Step 2: departments + HR invites ─────────────────────────
export const setupCompany = async (req, res) => {
  const { departments, hr_invites } = req.body;

  const result = await authService.setupCompany({
    managerId: req.params.managerId,
    departments:
      typeof departments === "string" ? JSON.parse(departments) : departments,
    hr_invites:
      typeof hr_invites === "string"
        ? JSON.parse(hr_invites)
        : hr_invites || [],
  });

  return success(res, result, "Company setup complete. HR invites sent.");
};

// ─── RESEND OTP (UPDATED) ────────────────────────────────────────────────────
export const resendOTP = async (req, res) => {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();

  await authService.resendOTP({ email });

  return success(res, { email }, "OTP resent successfully");
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginWithPassword({ email, password }, req);

  if (result.requiresOTP) {
    return success(
      res,
      { requiresOTP: true, email: result.email, name: result.name },
      "OTP sent to your email",
    );
  }

  setTokenCookie(res, result.refreshToken);

  return success(
    res,
    {
      requiresOTP: false,
      accessToken: result.accessToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        company_id: result.user.company_id,
        company_name: result.user.company_name,
        profile_image_url: result.user.profile_image_url,
      },
    },
    "Login successful",
  );
};

// ─── VERIFY LOGIN OTP (UPDATED) ──────────────────────────────────────────────
export const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body;

  const result = await authService.verifyLoginOTP({ email, otp }, req);

  setTokenCookie(res, result.refreshToken);

  return success(res, result, "Login successful");
};

// ─── Validate Invite Token ────────────────────────────────────────────────────
export const validateInviteToken = async (req, res) => {
  const { email, token } = req.query;
  const data = await authService.validateInviteToken({ email, token });
  return success(res, data, "Invite is valid");
};

// ─── Accept Invite for hr ────────────────────────────────────────────────────────────
export const acceptHRInvite = async (req, res) => {
  const { email, token, name, phone, password } = req.body;

  let profile_image_url = null;

  if (req.file) {
    profile_image_url = await processProfileImage(req.file.buffer);
  }

  await authService.acceptHRInvite({
    email,
    token,
    name,
    phone,
    password,
    profile_image_url,
  });

  return success(res, {}, "HR account activated successfully.");
};
// ─── Accept Invite for employee ────────────────────────────────────────────────────────────
export const acceptEmployeeInvite = async (req, res) => {
  const { email, token, password } = req.body;

  let profile_image_url = null;

  if (req.file) {
    profile_image_url = await processProfileImage(req.file.buffer);
  }

  await authService.acceptEmployeeInvite({
    email,
    token,
    password,
    profile_image_url,
  });

  return success(res, {}, "Employee account activated successfully.");
};
// ─── Token Management ─────────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  const token = req.body.refresh_token || req.cookies?.refreshToken;
  if (!token) return badRequest(res, "Refresh token required");

  const tokenData = await verifyRefreshToken(token);
  await revokeRefreshToken(token);

  const newAccessToken = generateAccessToken({
    sub: tokenData.user_id,
    role: tokenData.role,
    company: tokenData.company_id,
  });
  const newRefreshToken = generateRefreshToken();
  await saveRefreshToken(tokenData.user_id, newRefreshToken, req);

  setTokenCookie(res, newRefreshToken);
  return success(res, { accessToken: newAccessToken }, "Token refreshed");
};

export const logout = async (req, res) => {
  const token = req.body.refresh_token || req.cookies?.refreshToken;
  if (token) await revokeRefreshToken(token);
  res.clearCookie("refreshToken");
  return success(res, {}, "Logged out successfully");
};

// ─── OAuth ────────────────────────────────────────────────────────────────────
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: false,
});
export const facebookAuth = passport.authenticate("facebook", {
  scope: ["email"],
  session: false,
});

export const googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user)
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=Google authentication failed`,
      );
    try {
      const result = await authService.handleOAuthLogin(user, req);
      if (result.type === "login") {
        setTokenCookie(res, result.refreshToken);
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/oauth-success?token=${result.accessToken}`,
        );
      }
      const profileEncoded = Buffer.from(
        JSON.stringify(result.profile),
      ).toString("base64");
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/register?profile=${profileEncoded}`,
      );
    } catch (error) {
      logger.error("Google callback error:", error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  })(req, res, next);
};

export const facebookCallback = (req, res, next) => {
  passport.authenticate("facebook", { session: false }, async (err, user) => {
    if (err || !user)
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=Facebook authentication failed`,
      );
    try {
      const result = await authService.handleOAuthLogin(user, req);
      if (result.type === "login") {
        setTokenCookie(res, result.refreshToken);
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/oauth-success?token=${result.accessToken}`,
        );
      }
      const profileEncoded = Buffer.from(
        JSON.stringify(result.profile),
      ).toString("base64");
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/complete-registration?profile=${profileEncoded}`,
      );
    } catch (error) {
      logger.error("Facebook callback error:", error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(error.message)}`,
      );
    }
  })(req, res, next);
};

export const completeOAuthRegistration = async (req, res) => {
  const {
    name,
    email,
    provider,
    provider_id,
    company_name,
    company_type,
    branches,
    job_title,
    phone,
  } = req.body;
  const user = await authService.completeOAuthRegistration({
    name,
    email,
    provider,
    provider_id,
    company_name,
    company_type,
    branches:
      typeof branches === "string" ? JSON.parse(branches) : branches || [],
    job_title,
    phone,
  });

  const accessToken = generateAccessToken({
    sub: user.id,
    role: user.role,
    company: user.company_id,
  });
  const newRefreshToken = generateRefreshToken();
  await saveRefreshToken(user.id, newRefreshToken, req);
  setTokenCookie(res, newRefreshToken);

  return created(
    res,
    { accessToken, user },
    "Registration complete. Welcome to Basma!",
  );
};

// ─── Me ───────────────────────────────────────────────────────────────────────
export const me = async (req, res) => {
  const user = await authRepo.findUserById(req.user.id);
  return success(res, user);
};
