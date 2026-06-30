import crypto from "crypto";
import * as authRepo from "../features/auth/auth.repository.js";

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export const generateOTP = () => {
  // Generates a number between 100000 and 999999
  const bytes = crypto.randomBytes(3);
  const num = bytes.readUIntBE(0, 3);
  return String(100000 + (num % 900000));
};

/**
 * Save OTP to database (invalidates previous ones for same email+purpose)
 */
export const saveOTP = async (email, userId, purpose) => {
  const code = generateOTP();
  const expiresAt = new Date(
    Date.now() + parseInt(process.env.OTP_EXPIRES_MINUTES || 10) * 60 * 1000,
  );

  const existingOtp = await authRepo.fetchActiveOTP(email, purpose);
  const cooldownMs =
    parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60) * 1000;

  if (existingOtp && new Date(existingOtp.expires_at) > new Date()) {
    const elapsed = Date.now() - new Date(existingOtp.created_at).getTime();
    if (elapsed < cooldownMs) {
      throw Object.assign(
        new Error("Please wait before requesting a new OTP."),
        {
          statusCode: 429,
        },
      );
    }
  }

  await authRepo.invalidateOTPs(email, purpose);
  await authRepo.insertOTP({ userId, email, code, purpose, expiresAt });

  return code;
};

/**
 * Verify OTP - returns true if valid, throws descriptive error otherwise
 */
export const verifyOTP = async (email, code, purpose) => {
  const otp = await authRepo.fetchActiveOTP(email, purpose);

  if (!otp) {
    throw Object.assign(
      new Error("No active OTP found. Please request a new one."),
      { statusCode: 400 },
    );
  }

  // Check max attempts (5)
  if (otp.attempts >= 5) {
    throw Object.assign(
      new Error("Too many failed attempts. Please request a new OTP."),
      { statusCode: 429 },
    );
  }

  // Increment attempt counter
  await authRepo.incrementOTPAttempts(otp.id);

  // Check expiry
  if (new Date(otp.expires_at) < new Date()) {
    throw Object.assign(
      new Error("OTP has expired. Please request a new one."),
      { statusCode: 400 },
    );
  }

  // Check code
  if (otp.code !== code) {
    throw Object.assign(new Error("Invalid OTP code."), { statusCode: 400 });
  }

  // Mark as used
  await authRepo.markOTPAsUsed(otp.id);

  return true;
};
