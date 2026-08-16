const PurchaseOrder = require('../models/PurchaseOrder');
const InventoryMovement = require('../models/InventoryMovement');
const logAudit = require('../utils/auditLogger');

const getPurchaseOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.supplier) filter.supplier = req.query.supplier;

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.product', 'name sku')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    next(err);
  }
};

const getPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id)
      .populate('supplier', 'name contactPerson email phone')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.product', 'name sku unitPrice costPrice');

    if (!order) return res.status(404).json({ message: 'Purchase order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.create({
      ...req.body,
      status: 'draft',
      createdBy: req.user._id,
    });

    const populated = await PurchaseOrder.findById(order._id)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .populate('items.product', 'name sku');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

const updatePurchaseOrderStatus = async (req, res, next) => {
  const session = await PurchaseOrder.db.startSession();
  session.startTransaction();

  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (!PurchaseOrder.canTransition(order.status, status)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Invalid status transition from '${order.status}' to '${status}'`,
      });
    }

    const previousStatus = order.status;
    order.status = status;

    if (status === 'approved') {
      order.approvedBy = req.user._id;
    }

    if (status === 'received') {
      order.receivedAt = new Date();

      for (const item of order.items) {
        await InventoryMovement.create(
          [
            {
              product: item.product,
              type: 'purchase',
              quantity: item.quantity,
              reason: 'Purchase order received',
              reference: order.poNumber,
              performedBy: req.user._id,
            },
          ],
          { session }
        );
      }
    }

    await order.save({ session });

    await logAudit({
      action: 'status_change',
      entityType: 'PurchaseOrder',
      entityId: order._id,
      performedBy: req.user._id,
      details: `Status changed from ${previousStatus} to ${status}`,
    });

    await session.commitTransaction();

    const populated = await PurchaseOrder.findById(order._id)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.product', 'name sku');

    res.json(populated);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
};
