const express = require('express');
const { body } = require('express-validator');
const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getSuppliers);
router.get('/:id', getSupplier);
router.post('/', authorize('admin'), [body('name').trim().notEmpty()], validate, createSupplier);
router.put('/:id', authorize('admin'), updateSupplier);
router.delete('/:id', authorize('admin'), deleteSupplier);

module.exports = router;
