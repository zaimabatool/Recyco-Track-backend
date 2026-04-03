import Order from '../models/Order.js';
import Counter from '../models/Counter.js';

/**
 * @desc    Create a new scrap order (user submitting scrap to sell)
 * @route   POST /api/orders
 * @access  Private (User)
 */
export const createOrder = async (req, res) => {
    try {
        const { materialName, weight, amount, paymentMethod, paymentDetails, items } = req.body;

        if (!materialName || !weight || !amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'materialName, weight, amount, and paymentMethod are required'
            });
        }

        // Get next sequential order number
        const counter = await Counter.findOneAndUpdate(
            { id: 'orderNumber' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const order = await Order.create({
            orderNumber: counter.seq,
            userId: req.user._id,
            customerName: req.user.name,
            materialName,
            weight: parseFloat(weight),
            amount: parseFloat(amount),
            status: 'Pending',
            paymentMethod,
            paymentDetails: paymentMethod === 'online' ? paymentDetails : null,
            items: items || [],
            date: new Date()
        });

        res.status(201).json({
            success: true,
            order: { ...order.toObject(), id: order._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get current user's orders
 * @route   GET /api/orders/my
 * @access  Private (User)
 */
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id }).sort({ date: -1 });

        const formattedOrders = orders.map(order => ({
            ...order.toObject(),
            id: order._id
        }));

        res.json({
            success: true,
            count: formattedOrders.length,
            orders: formattedOrders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Accept a price proposal from admin
 * @route   PUT /api/orders/:id/accept-proposal
 * @access  Private (User)
 */
export const acceptProposal = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify the order belongs to the current user
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
        }

        if (order.status !== 'Price Proposed') {
            return res.status(400).json({ success: false, message: 'Order is not in Price Proposed status' });
        }

        order.status = 'Price Accepted';
        
        // Sync negotiated values to primary fields
        if (order.finalPrice !== undefined) {
            order.amount = order.finalPrice;
        }
        if (order.finalWeight !== undefined) {
            order.weight = order.finalWeight;
        }

        await order.save();

        res.json({
            success: true,
            order: { ...order.toObject(), id: order._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Reject a price proposal from admin
 * @route   PUT /api/orders/:id/reject-proposal
 * @access  Private (User)
 */
export const rejectProposal = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify the order belongs to the current user
        if (order.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
        }

        if (order.status !== 'Price Proposed') {
            return res.status(400).json({ success: false, message: 'Order is not in Price Proposed status' });
        }

        order.status = 'Price Rejected';
        await order.save();

        res.json({
            success: true,
            order: { ...order.toObject(), id: order._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
