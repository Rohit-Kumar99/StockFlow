const express = require('express');
const { body } = require('express-validator');
const {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} = require('../controllers/purchaseOrderController');
const protect = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.post(
  '/',
  [
    body('supplier').notEmpty(),
    body('items').isArray({ min: 1 }),
    body('items.*.product').notEmpty(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.unitCost').isFloat({ min: 0 }),
  ],
  validate,
  createPurchaseOrder
);
router.put(
  '/:id/status',
  [body('status').isIn(['draft', 'pending', 'approved', 'received', 'cancelled'])],
  validate,
  updatePurchaseOrderStatus
);

module.exports = router;
