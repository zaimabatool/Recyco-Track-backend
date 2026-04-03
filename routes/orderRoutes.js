import express from 'express';
import { createOrder, getMyOrders, acceptProposal, rejectProposal } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All order routes require authentication
router.use(protect);

// POST /api/orders              - Create new order
router.post('/', createOrder);

// GET /api/orders/my            - Get current user's orders
router.get('/my', getMyOrders);

// PUT /api/orders/:id/accept-proposal  - Accept price proposal
router.put('/:id/accept-proposal', acceptProposal);

// PUT /api/orders/:id/reject-proposal  - Reject price proposal
router.put('/:id/reject-proposal', rejectProposal);

export default router;
