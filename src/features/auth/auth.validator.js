import { body } from "express-validator";

// ─── Signup ─────────────────────────────
export const managerSignupValidator = [
  body("name").trim().notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  body("company_name").trim().notEmpty(),
  body("company_type").trim().notEmpty(),
  body("job_title").trim().notEmpty(),
  body("phone").optional().isMobilePhone(),
];

// ─── Manager Signup Step 2: departments + HR invites ─────────────────────────
export const managerSetupValidator = [
  body("departments")
    .isArray({ min: 1 })
    .withMessage("At least one department is required"),
  body("departments.*")
    .trim()
    .notEmpty()
    .withMessage("Department name cannot be empty"),
  // hr_invites is optional — manager can skip adding HRs at signup
  body("hr_invites")
    .optional()
    .isArray()
    .withMessage("hr_invites must be an array"),
  body("hr_invites.*.email")
    .isEmail()
    .withMessage("Each HR must have a valid email"),
  body("hr_invites.*.branch")
    .trim()
    .notEmpty()
    .withMessage("Each HR must have a branch"),
];

// ─── OTP (NO PURPOSE) ─────────────────────
export const otpValidator = [
  body("email").isEmail(),
  body("otp").isLength({ min: 6, max: 6 }).isNumeric(),
];

// ─── Resend OTP ─────────────────────────
export const resendOTPValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

// ─── Login ────────────────────────────────
export const loginValidator = [
  body("email").isEmail(),
  body("password").notEmpty(),
];
// ─── Invite accept: HR or Employee sets their details ────────────────────────
export const acceptHRInviteValidator = [
  body("token").notEmpty(),

  body("email").isEmail(),

  body("name").trim().notEmpty().isLength({ min: 2 }),

  body("phone").trim().notEmpty().isMobilePhone(),

  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),

  body("confirm_password").custom((v, { req }) => {
    if (v !== req.body.password) throw new Error("Passwords do not match");
    return true;
  }),
];
export const acceptEmployeeInviteValidator = [
  body("token").notEmpty(),

  body("email").isEmail(),

  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),

  body("confirm_password").custom((v, { req }) => {
    if (v !== req.body.password) throw new Error("Passwords do not match");
    return true;
  }),
];

// ─── Token refresh ────────────────────────────────────────────────────────────
export const refreshTokenValidator = [
  body("refresh_token").notEmpty().withMessage("Refresh token is required"),
];

export const acceptInviteValidator = acceptHRInviteValidator;

export default {
  managerSignupValidator,
  managerSetupValidator,
  loginValidator,
  otpValidator,
  acceptInviteValidator,
  acceptHRInviteValidator,
  acceptEmployeeInviteValidator,
  refreshTokenValidator,
  resendOTPValidator,
};
