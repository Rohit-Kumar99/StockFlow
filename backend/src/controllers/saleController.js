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
  const session = await Sale.db.startSession();
  session.startTransaction();

  try {
    const { items } = req.body;

    for (const item of items) {
      const stock = await getProductStock(item.product);
      if (stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          message: `Insufficient stock for product ${item.product}. Available: ${stock}, requested: ${item.quantity}`,
        });
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const [sale] = await Sale.create(
      [
        {
          items,
          totalAmount,
          soldBy: req.user._id,
        },
      ],
      { session }
    );

    for (const item of items) {
      await InventoryMovement.create(
        [
          {
            product: item.product,
            type: 'sale',
            quantity: -item.quantity,
            reason: 'Sale recorded',
            reference: sale.saleNumber,
            performedBy: req.user._id,
          },
        ],
        { session }
      );
    }

    await logAudit({
      action: 'create',
      entityType: 'Sale',
      entityId: sale._id,
      performedBy: req.user._id,
      details: `Sale ${sale.saleNumber} created for ${totalAmount}`,
    });

    await session.commitTransaction();

    const populated = await Sale.findById(sale._id)
      .populate('soldBy', 'name')
      .populate('items.product', 'name sku');

    res.status(201).json(populated);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

module.exports = { getSales, getSale, createSale };
