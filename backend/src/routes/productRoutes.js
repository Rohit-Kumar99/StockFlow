const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStock,
} = require('../controllers/productController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getProducts);
router.get('/:id/stock', getProductStock);
router.get('/:id', getProduct);
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('sku').trim().notEmpty(),
    body('category').notEmpty(),
    body('supplier').notEmpty(),
    body('unitPrice').isFloat({ min: 0 }),
    body('costPrice').isFloat({ min: 0 }),
    body('minStockLevel').optional().isInt({ min: 0 }),
  ],
  validate,
  createProduct
);
router.put('/:id', authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);

module.exports = router;
