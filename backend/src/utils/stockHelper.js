const mongoose = require('mongoose');
const InventoryMovement = require('../models/InventoryMovement');

const getProductStock = async (productId) => {
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
};

const getStockForProducts = async (productIds) => {
  if (!productIds.length) return {};

  const objectIds = productIds.map((id) => new mongoose.Types.ObjectId(id));
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
};

module.exports = { getProductStock, getStockForProducts };
