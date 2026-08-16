const express = require('express');
const { body } = require('express-validator');
const User = require('../models/User');
const { register, login, getMe } = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

// Middleware: Allow first registration (admin creation), then require auth for subsequent registrations
const allowFirstRegisterOnly = async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    // If users exist, require authentication; otherwise allow open registration
    if (count > 0) {
      return protect(req, res, next);
    }
    next();
  } catch (err) {
    next(err);
  }
};

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'staff']),
  ],
  validate,
  allowFirstRegisterOnly,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

module.exports = router;
