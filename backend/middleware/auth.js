const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const User = require('../models/User');

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
    if (!token) {
      const error = new Error('Authentication required');
      error.status = 401;
      throw error;
    }
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.active) {
      const error = new Error('Invalid account');
      error.status = 401;
      throw error;
    }
    req.user = user;
    next();
  } catch (error) {
    error.status = error.status || 401;
    next(error);
  }
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error('Forbidden');
      error.status = 403;
      return next(error);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
