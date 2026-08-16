const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    items: { type: [purchaseOrderItemSchema], validate: [(v) => v.length > 0, 'At least one item required'] },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'received', 'cancelled'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedAt: { type: Date },
  },
  { timestamps: true }
);

purchaseOrderSchema.pre('save', async function (next) {
  if (this.poNumber) return next();

  const count = await mongoose.model('PurchaseOrder').countDocuments();
  this.poNumber = `PO-${String(count + 1).padStart(5, '0')}`;
  next();
});

const VALID_TRANSITIONS = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

purchaseOrderSchema.statics.canTransition = (from, to) => {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
};

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
