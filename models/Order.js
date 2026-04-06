import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    material: { type: String },
    weight: { type: Number },
    detectedWeight: { type: Number },
    unit: { type: String, default: 'kg' },
    price: { type: Number },
    confidence: { type: Number },
    quality: { type: String },
    category: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: Number,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    materialName: {
        type: String,
        required: [true, 'Material name is required'],
        trim: true
    },
    weight: {
        type: Number,
        required: [true, 'Weight is required'],
        min: [0.1, 'Weight must be at least 0.1']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    status: {
        type: String,
        enum: ['Pending', 'Scheduled', 'Price Proposed', 'Price Accepted', 'Price Rejected', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'online'],
        required: [true, 'Payment method is required']
    },
    paymentDetails: {
        accountNumber: { type: String },
        accountName: { type: String }
    },
    items: [orderItemSchema],

    // Scheduling fields
    pickupTime: {
        type: String,
        default: ''
    },

    // Negotiation fields
    finalWeight: { type: Number },
    finalPrice: { type: Number },
    originalPrice: { type: Number },
    originalWeight: { type: Number },

    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
