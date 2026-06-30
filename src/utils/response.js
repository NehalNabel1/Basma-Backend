/**
 * Standardized API response helpers
 */

export const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const created = (res, data = {}, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

export const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

export const unauthorized = (res, message = 'Unauthorized') => error(res, message, 401);
export const forbidden = (res, message = 'Forbidden') => error(res, message, 403);
export const notFound = (res, message = 'Not found') => error(res, message, 404);
export const badRequest = (res, message = 'Bad request', errors = null) => error(res, message, 400, errors);
export const conflict = (res, message = 'Conflict') => error(res, message, 409);

export default { success, created, error, unauthorized, forbidden, notFound, badRequest, conflict };
