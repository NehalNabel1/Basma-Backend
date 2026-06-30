import { verifyAccessToken } from '../utils/jwt.js';
import * as authRepo from '../features/auth/auth.repository.js';
import { unauthorized, forbidden } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Protect routes - verifies JWT and attaches user to req
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Extract from Authorization header or cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return unauthorized(res, 'Authentication required');

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired');
      if (err.name === 'JsonWebTokenError') return unauthorized(res, 'Invalid token');
      return unauthorized(res, 'Authentication failed');
    }

    // Fetch fresh user from DB using repository
    const user = await authRepo.findUserById(decoded.sub);

    if (!user) return unauthorized(res, 'User not found');

    if (!user.is_active) return forbidden(res, 'Account is deactivated');
    if (!user.is_verified) return forbidden(res, 'Account is not verified');

    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    return unauthorized(res, 'Authentication failed');
  }
};

/**
 * Role-based access control
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Access denied. Required roles: ${roles.join(', ')}`);
    }
    next();
  };
};

/**
 * Ensure user belongs to the same company (tenant isolation)
 */
export const sameCompany = (paramName = 'companyId') => {
  return (req, res, next) => {
    const targetCompanyId = req.params[paramName] || req.body.company_id;
    if (targetCompanyId && targetCompanyId !== req.user.company_id) {
      return forbidden(res, 'Cross-company access denied');
    }
    next();
  };
};

export default { protect, authorize, sameCompany };
