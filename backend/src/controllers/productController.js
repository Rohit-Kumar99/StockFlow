const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');
const { getProductStock: calcStock, getStockForProducts } = require('../utils/stockHelper');

const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const productIds = products.map((p) => p._id);
    const stockMap = await getStockForProducts(productIds);

    let enriched = products.map((p) => ({
      ...p.toObject(),
      currentStock: stockMap[p._id.toString()] || 0,
    }));

    if (req.query.stockStatus === 'low') {
      enriched = enriched.filter((p) => p.currentStock <= p.minStockLevel);
    } else if (req.query.stockStatus === 'ok') {
      enriched = enriched.filter((p) => p.currentStock > p.minStockLevel);
    }

    const total = await Product.countDocuments(filter);

    res.json({
      products: enriched,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    next(err);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('supplier', 'name contactPerson email phone');

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const currentStock = await calcStock(product._id);
    res.json({ ...product.toObject(), currentStock });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    const populated = await Product.findById(product._id)
      .populate('category', 'name')
      .populate('supplier', 'name');
    res.status(201).json({ ...populated.toObject(), currentStock: 0 });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name')
      .populate('supplier', 'name');

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const currentStock = await calcStock(product._id);
    res.json({ ...product.toObject(), currentStock });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

const getProductStock = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const currentStock = await calcStock(product._id);
    const movements = await InventoryMovement.find({ product: product._id })
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ productId: product._id, currentStock, recentMovements: movements });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStock,
};
