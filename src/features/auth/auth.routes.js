import express from "express";
import * as ctrl from "./auth.controller.js";
import { validate } from "../../middleware/validate.middleware.js";
import { protect } from "../../middleware/auth.middleware.js";
import {
  authLimiter,
  otpLimiter,
} from "../../middleware/rateLimiter.middleware.js";
import { uploadLogo, uploadProfileImage } from "../../utils/upload.js";
import {
  managerSignupValidator,
  managerSetupValidator,
  loginValidator,
  otpValidator,
  acceptHRInviteValidator,
  acceptEmployeeInviteValidator,
  refreshTokenValidator,
  resendOTPValidator,
} from "./auth.validator.js";

const router = express.Router();

// ─── Manager Signup ───────────────────────────────────────────────────────────

router.post(
  "/manager/signup",
  managerSignupValidator,
  validate,
  ctrl.managerSignup,
);
router.post("/verify-otp/signup", otpValidator, validate, ctrl.verifySignupOTP);
router.post("/verify-otp/login", otpValidator, validate, ctrl.verifyLoginOTP);
router.post(
  "/manager/:managerId/setup",
  authLimiter,
  managerSetupValidator,
  validate,
  ctrl.setupCompany,
);
router.post(
  "/resend-otp",
  otpLimiter,
  resendOTPValidator,
  validate,
  ctrl.resendOTP,
);
router.post("/login", loginValidator, validate, ctrl.login);

// ─── Invite Flow ──────────────────────────────────────────────────────────────
router.get("/invite/validate", ctrl.validateInviteToken);
router.post(
  "/invite/accept/hr",
  authLimiter,
  uploadProfileImage,
  acceptHRInviteValidator,
  validate,
  ctrl.acceptHRInvite,
);

router.post(
  "/invite/accept/employee",
  authLimiter,
  uploadProfileImage,
  acceptEmployeeInviteValidator,
  validate,
  ctrl.acceptEmployeeInvite,
);

// ─── Token Management ─────────────────────────────────────────────────────────
router.post(
  "/refresh-token",
  refreshTokenValidator,
  validate,
  ctrl.refreshToken,
);
router.post("/logout", ctrl.logout);

// ─── OAuth ────────────────────────────────────────────────────────────────────
router.get("/google", ctrl.googleAuth);
router.get("/google/callback", ctrl.googleCallback);
router.get("/facebook", ctrl.facebookAuth);
router.get("/facebook/callback", ctrl.facebookCallback);
router.post(
  "/oauth/complete-registration",
  authLimiter,
  ctrl.completeOAuthRegistration,
);

// ─── Protected ────────────────────────────────────────────────────────────────
router.get("/me", protect, ctrl.me);

export default router;
