const database = require('../database');
const AppError = require('../utils/appError');
const { verifyToken } = require('../utils/tokens');

function authenticate(request, response, next) {
  try {
    const token = request.cookies.campusfind_token;
    if (!token) throw new AppError('Please log in to continue.', 401);

    const payload = verifyToken(token);
    const user = database.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(payload.id);
    if (!user) throw new AppError('Your account no longer exists.', 401);

    request.user = user;
    next();
  } catch (error) {
    next(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
      ? new AppError('Your session has expired. Please log in again.', 401)
      : error);
  }
}

function requireAdmin(request, response, next) {
  if (request.user.role !== 'ADMIN') return next(new AppError('Administrator access is required.', 403));
  next();
}

module.exports = { authenticate, requireAdmin };
