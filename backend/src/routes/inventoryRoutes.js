const express = require('express');
const { body } = require('express-validator');
const {
  getMovements,
  createAdjustment,
  getLowStock,
  exportInventory,
} = require('../controllers/inventoryController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/movements', getMovements);
router.get('/low-stock', getLowStock);
router.get('/export', authorize('admin'), exportInventory);
router.post(
  '/adjustments',
  authorize('admin'),
  [
    body('product').notEmpty(),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('reason').optional().trim(),
    body('type').optional().isIn(['damage', 'return', 'adjustment']),
  ],
  validate,
  createAdjustment
);

module.exports = router;
