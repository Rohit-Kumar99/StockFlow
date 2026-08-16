const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const InventoryMovement = require('../models/InventoryMovement');
const { getProductStock } = require('../utils/stockHelper');
const logAudit = require('../utils/auditLogger');

const getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .populate('soldBy', 'name')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    next(err);
  }
};

const getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('soldBy', 'name email')
      .populate('items.product', 'name sku unitPrice');

    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    next(err);
  }
};

const createSale = async (req, res, next) => {
  try {
    const { items } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required for a sale' });
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.product || !item.quantity || !item.unitPrice) {
        return res.status(400).json({ message: 'Each item must have product, quantity, and unitPrice' });
      }
      if (item.quantity < 1) {
        return res.status(400).json({ message: 'Item quantity must be at least 1' });
      }
    }

    for (const item of items) {
      const stock = await getProductStock(item.product);
      if (stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${item.product}. Available: ${stock}, requested: ${item.quantity}`,
        });
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const sale = await Sale.create({
      items,
      totalAmount,
      soldBy: req.user._id,
    });

    for (const item of items) {
      await InventoryMovement.create({
        product: item.product,
        type: 'sale',
        quantity: -item.quantity,
        reason: 'Sale recorded',
        reference: sale.saleNumber,
        performedBy: req.user._id,
      });
    }

    await logAudit({
      action: 'create',
      entityType: 'Sale',
      entityId: sale._id,
      performedBy: req.user._id,
      details: `Sale ${sale.saleNumber} created for ${totalAmount}`,
    });

    const populated = await Sale.findById(sale._id)
      .populate('soldBy', 'name')
      .populate('items.product', 'name sku');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getSales, getSale, createSale };
