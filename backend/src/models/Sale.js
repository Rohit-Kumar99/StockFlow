const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    saleNumber: { type: String, unique: true },
    items: { type: [saleItemSchema], validate: [(v) => v.length > 0, 'At least one item required'] },
    totalAmount: { type: Number, required: true, min: 0 },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

saleSchema.pre('save', async function (next) {
  if (this.saleNumber) return next();

  const count = await mongoose.model('Sale').countDocuments();
  this.saleNumber = `SALE-${String(count + 1).padStart(5, '0')}`;
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
