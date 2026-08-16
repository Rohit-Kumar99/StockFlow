const InventoryMovement = require('../models/InventoryMovement');
const Product = require('../models/Product');
const { getStockForProducts } = require('../utils/stockHelper');
const exportToCSV = require('../utils/csvExporter');

const getMovements = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.product) filter.product = req.query.product;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const end = new Date(req.query.dateTo);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      InventoryMovement.find(filter)
        .populate('product', 'name sku')
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InventoryMovement.countDocuments(filter),
    ]);

    res.json({ movements, page, pages: Math.ceil(total / limit), total });
  } catch (err) {
    next(err);
  }
};

const createAdjustment = async (req, res, next) => {
  try {
    const { product, quantity, reason, type } = req.body;

    const movement = await InventoryMovement.create({
      product,
      type: type || 'adjustment',
      quantity,
      reason,
      reference: 'Manual adjustment',
      performedBy: req.user._id,
    });

    const populated = await InventoryMovement.findById(movement._id)
      .populate('product', 'name sku')
      .populate('performedBy', 'name');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .populate('supplier', 'name');

    const stockMap = await getStockForProducts(products.map((p) => p._id));

    const lowStock = products
      .map((p) => ({
        ...p.toObject(),
        currentStock: stockMap[p._id.toString()] || 0,
      }))
      .filter((p) => p.currentStock <= p.minStockLevel)
      .sort((a, b) => a.currentStock - b.currentStock);

    const total = lowStock.length;
    const paginatedLowStock = lowStock.slice(skip, skip + limit);

    res.json({ 
      lowStock: paginatedLowStock,
      page, 
      pages: Math.ceil(total / limit), 
      total 
    });
  } catch (err) {
    next(err);
  }
};

const exportInventory = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .populate('supplier', 'name');

    const stockMap = await getStockForProducts(products.map((p) => p._id));

    const data = products.map((p) => ({
      name: p.name,
      sku: p.sku,
      category: p.category?.name || '',
      supplier: p.supplier?.name || '',
      unitPrice: p.unitPrice,
      costPrice: p.costPrice,
      currentStock: stockMap[p._id.toString()] || 0,
      minStockLevel: p.minStockLevel,
      status: (stockMap[p._id.toString()] || 0) <= p.minStockLevel ? 'LOW' : 'OK',
    }));

    const csv = exportToCSV(data, [
      'name',
      'sku',
      'category',
      'supplier',
      'unitPrice',
      'costPrice',
      'currentStock',
      'minStockLevel',
      'status',
    ]);

    res.header('Content-Type', 'text/csv');
    res.attachment('inventory-export.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMovements, createAdjustment, getLowStock, exportInventory };
