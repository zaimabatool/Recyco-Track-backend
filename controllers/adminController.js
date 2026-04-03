import Order from '../models/Order.js';
import Rate from '../models/Rate.js';
import User from '../models/User.js';

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Admin
 */
export const getDashboardStats = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const activeRates = await Rate.countDocuments();
        const totalUsers = await User.countDocuments({ role: 'user' });

        // Today's revenue from completed orders
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    status: 'Completed',
                    date: { $gte: today, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            stats: {
                totalOrders,
                activeRates,
                totalUsers,
                todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all orders (admin view)
 * @route   GET /api/admin/orders
 * @access  Admin
 */
export const getAllOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};

        if (status && status !== 'All') {
            filter.status = status;
        }

        const orders = await Order.find(filter)
            .populate('userId', 'name email phone')
            .sort({ date: -1 });

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
 * @desc    Update order status (generic)
 * @route   PUT /api/admin/orders/:id/status
 * @access  Admin
 */
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Scheduled', 'Price Proposed', 'Price Accepted', 'Price Rejected', 'Completed', 'Cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;
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
 * @desc    Schedule a pickup for an order
 * @route   PUT /api/admin/orders/:id/schedule
 * @access  Admin
 */
export const schedulePickup = async (req, res) => {
    try {
        const { startDate, endDate, startTime, endTime } = req.body;

        if (!startDate || !endDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'startDate, endDate, startTime, and endTime are required'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Format pickup time string (matches frontend format)
        const start = new Date(startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const end = new Date(endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const pickupTime = `${start} - ${end}, ${startTime} to ${endTime}`;

        order.status = 'Scheduled';
        order.pickupTime = pickupTime;
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
 * @desc    Finalize order (confirm as completed or propose new price)
 * @route   PUT /api/admin/orders/:id/finalize
 * @access  Admin
 */
export const finalizeOrder = async (req, res) => {
    try {
        const { weight, price } = req.body;

        if (!weight || !price) {
            return res.status(400).json({
                success: false,
                message: 'weight and price are required'
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const priceChanged = parseFloat(price) !== parseFloat(order.amount) ||
            parseFloat(weight) !== parseFloat(order.weight);

        if (priceChanged) {
            // Send price proposal to user
            order.status = 'Price Proposed';
            order.finalWeight = parseFloat(weight);
            order.finalPrice = parseFloat(price);
            order.originalPrice = order.amount;
            order.originalWeight = order.weight;
        } else {
            // Complete the order directly
            order.status = 'Completed';
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
 * @desc    Get revenue analytics
 * @route   GET /api/admin/revenue
 * @access  Admin
 */
export const getRevenue = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let dateFilter = { status: 'Completed' };

        if (startDate || endDate) {
            dateFilter.date = {};
            if (startDate) {
                dateFilter.date.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.date.$lte = end;
            }
        }

        const completedOrders = await Order.find(dateFilter).sort({ date: -1 });

        // Total revenue
        const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

        // Daily breakdown
        const dailyMap = {};
        completedOrders.forEach(order => {
            const dateKey = new Date(order.date).toLocaleDateString();
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = { revenue: 0, count: 0 };
            }
            dailyMap[dateKey].revenue += order.amount || 0;
            dailyMap[dateKey].count += 1;
        });

        const dailyRevenue = Object.entries(dailyMap)
            .map(([date, data]) => ({ date, revenue: data.revenue, ordersCount: data.count }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            success: true,
            stats: {
                totalRevenue,
                completedOrdersCount: completedOrders.length,
                averageOrderValue: completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0,
                dailyRevenue: dailyRevenue.map(item => ({
                    date: item.date,
                    amount: item.revenue,
                    count: item.ordersCount
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get transaction history (completed + cancelled orders)
 * @route   GET /api/admin/history
 * @access  Admin
 */
export const getHistory = async (req, res) => {
    try {
        const historyOrders = await Order.find({
            status: { $in: ['Completed', 'Cancelled'] }
        })
            .populate('userId', 'name email')
            .sort({ date: -1 });

        const formattedOrders = historyOrders.map(order => ({
            ...order.toObject(),
            id: order._id
        }));

        res.json({
            success: true,
            count: formattedOrders.length,
            history: formattedOrders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
