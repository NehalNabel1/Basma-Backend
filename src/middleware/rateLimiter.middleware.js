import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  });

// Strict: auth endpoints
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 min
  20,
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// OTP: even stricter
export const otpLimiter = createLimiter(
  10 * 60 * 1000, // 10 min
  10,
  'Too many OTP requests. Please wait before trying again.'
);

// General API
export const apiLimiter = createLimiter(
  60 * 1000, // 1 min
  100,
  'Too many requests. Please slow down.'
);

// Invite sending
export const inviteLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  30,
  'Too many invite requests in this hour.'
);

export default { authLimiter, otpLimiter, apiLimiter, inviteLimiter };
