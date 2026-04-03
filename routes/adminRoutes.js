import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
    getDashboardStats,
    getAllOrders,
    updateOrderStatus,
    schedulePickup,
    finalizeOrder,
    getRevenue,
    getHistory
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// GET /api/admin/dashboard          - Dashboard stats
router.get('/dashboard', getDashboardStats);

// GET /api/admin/orders             - Get all orders
router.get('/orders', getAllOrders);

// PUT /api/admin/orders/:id/status  - Update order status
router.put('/orders/:id/status', updateOrderStatus);

// PUT /api/admin/orders/:id/schedule - Schedule pickup
router.put('/orders/:id/schedule', schedulePickup);

// PUT /api/admin/orders/:id/finalize - Finalize / negotiate price
router.put('/orders/:id/finalize', finalizeOrder);

// GET /api/admin/revenue            - Revenue analytics
router.get('/revenue', getRevenue);

// GET /api/admin/history            - Transaction history
router.get('/history', getHistory);

export default router;
