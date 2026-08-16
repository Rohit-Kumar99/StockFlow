const mongoose = require('mongoose');
const InventoryMovement = require('../models/InventoryMovement');

const getProductStock = async (productId) => {
  try {
    // Validate productId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return 0;
    }

    const result = await InventoryMovement.aggregate([
      {
        $match: {
          product: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$quantity' },
        },
      },
    ]);

    return result[0]?.total || 0;
  } catch (error) {
    console.error(`Error calculating stock for product ${productId}:`, error);
    return 0;
  }
};

const getStockForProducts = async (productIds) => {
  try {
    if (!productIds.length) return {};

    // Filter out invalid ObjectIds
    const validIds = productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) return {};

    const objectIds = validIds.map((id) => new mongoose.Types.ObjectId(id));
    const results = await InventoryMovement.aggregate([
      { $match: { product: { $in: objectIds } } },
      { $group: { _id: '$product', total: { $sum: '$quantity' } } },
    ]);

    const stockMap = {};
    productIds.forEach((id) => {
      stockMap[id.toString()] = 0;
    });
    results.forEach((row) => {
      stockMap[row._id.toString()] = row.total;
    });

    return stockMap;
  } catch (error) {
    console.error('Error calculating stock for products:', error);
    const fallbackMap = {};
    productIds.forEach((id) => {
      fallbackMap[id.toString()] = 0;
    });
    return fallbackMap;
  }
};

module.exports = { getProductStock, getStockForProducts };
