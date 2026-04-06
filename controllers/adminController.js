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
/**
 * @desc    Get all riders
 * @route   GET /api/admin/riders
 * @access  Admin
 */
export const getRiders = async (req, res) => {
    try {
        const riders = await User.find({ role: 'rider' }).select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: riders.length,
            riders: riders.map(r => ({ ...r.toObject(), id: r._id }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create a new rider
 * @route   POST /api/admin/riders
 * @access  Admin
 */
export const createRider = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const rider = await User.create({
            name,
            email,
            password,
            phone: phone || '',
            role: 'rider'
        });

        res.status(201).json({
            success: true,
            rider: { ...rider.toObject(), id: rider._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete a rider
 * @route   DELETE /api/admin/riders/:id
 * @access  Admin
 */
export const deleteRider = async (req, res) => {
    try {
        const rider = await User.findById(req.params.id);

        if (!rider || rider.role !== 'rider') {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Rider account deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * @desc    Update a rider
 * @route   PUT /api/admin/riders/:id
 * @access  Admin
 */
export const updateRider = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const rider = await User.findById(req.params.id);

        if (!rider || rider.role !== 'rider') {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        // Check if email is already taken by another user
        if (email && email !== rider.email) {
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ success: false, message: 'User already exists with this email' });
            }
            rider.email = email;
        }

        if (name) rider.name = name;
        if (phone !== undefined) rider.phone = phone;
        if (password) rider.password = password;

        await rider.save();

        res.json({
            success: true,
            rider: { ...rider.toObject(), id: rider._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all regular users (customers)
 * @route   GET /api/admin/users
 * @access  Admin
 */
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            users: users.map(u => ({ ...u.toObject(), id: u._id }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create a new customer user
 * @route   POST /api/admin/users
 * @access  Admin
 */
export const createUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone: phone || '',
            role: 'user'
        });

        res.status(201).json({
            success: true,
            user: { ...user.toObject(), id: user._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update a customer user
 * @route   PUT /api/admin/users/:id
 * @access  Admin
 */
export const updateUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'user') {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (password) user.password = password;

        await user.save();

        res.json({
            success: true,
            user: { ...user.toObject(), id: user._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete a customer user
 * @route   DELETE /api/admin/users/:id
 * @access  Admin
 */
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'user') {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User account deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
