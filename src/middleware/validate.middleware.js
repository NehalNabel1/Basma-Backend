import { validationResult } from 'express-validator';
import { badRequest } from '../utils/response.js';

/**
 * Runs after express-validator chains and returns 400 if any errors exist
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return badRequest(res, 'Validation failed', formatted);
  }
  next();
};

export default validate;
