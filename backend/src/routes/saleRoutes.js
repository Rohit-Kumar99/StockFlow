const express = require('express');
const { body } = require('express-validator');
const { getSales, getSale, createSale } = require('../controllers/saleController');
const protect = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getSales);
router.get('/:id', getSale);
router.post(
  '/',
  [
    body('items').isArray({ min: 1 }),
    body('items.*.product').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitPrice').isFloat({ min: 0 }),
  ],
  validate,
  createSale
);

module.exports = router;
