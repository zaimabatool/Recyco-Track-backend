import express from 'express';
import { protect, adminOnly, staffOnly } from '../middleware/authMiddleware.js';
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

// Middleware: All routes require authentication
router.use(protect);

// Admin-Only Routes
router.get('/dashboard', adminOnly, getDashboardStats);
router.put('/orders/:id/schedule', adminOnly, schedulePickup);
router.get('/revenue', adminOnly, getRevenue);
router.get('/history', adminOnly, getHistory);

// Staff Routes (Admin + Rider)
router.get('/orders', staffOnly, getAllOrders);
router.put('/orders/:id/status', staffOnly, updateOrderStatus);
router.put('/orders/:id/finalize', staffOnly, finalizeOrder);

// Rider Management (Admin-Only)
import { 
    getRiders, createRider, deleteRider, updateRider,
    getUsers, createUser, updateUser, deleteUser 
} from '../controllers/adminController.js';

router.get('/riders', adminOnly, getRiders);
router.post('/riders', adminOnly, createRider);
router.put('/riders/:id', adminOnly, updateRider);
router.delete('/riders/:id', adminOnly, deleteRider);

// User Management (Admin-Only)
router.get('/users', adminOnly, getUsers);
router.post('/users', adminOnly, createUser);
router.put('/users/:id', adminOnly, updateUser);
router.delete('/users/:id', adminOnly, deleteUser);

export default router;
