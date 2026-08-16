const Product = require('../models/Product');
const PurchaseOrder = require('../models/PurchaseOrder');
const Sale = require('../models/Sale');
const { getStockForProducts } = require('../utils/stockHelper');

const getSummary = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [products, pendingPOs, salesToday, salesTodayData] = await Promise.all([
      Product.find({ isActive: true }),
      PurchaseOrder.countDocuments({ status: { $in: ['draft', 'pending', 'approved'] } }),
      Sale.countDocuments({ createdAt: { $gte: todayStart } }),
      Sale.find({ createdAt: { $gte: todayStart } }),
    ]);

    const stockMap = await getStockForProducts(products.map((p) => p._id));
    const lowStockCount = products.filter(
      (p) => (stockMap[p._id.toString()] || 0) <= p.minStockLevel
    ).length;

    const salesTodayTotal = salesTodayData.reduce((sum, s) => sum + s.totalAmount, 0);

    const recentSales = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(7)
      .select('totalAmount createdAt');

    const salesByDay = {};
    recentSales.forEach((s) => {
      const day = s.createdAt.toISOString().split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + s.totalAmount;
    });

    const chartData = Object.entries(salesByDay)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalProducts: products.length,
      lowStockCount,
      pendingPOs,
      salesToday,
      salesTodayTotal,
      chartData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary };
