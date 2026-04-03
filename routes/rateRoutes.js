import express from 'express';
import { getAllRates, getRateById, createRate, updateRate, deleteRate } from '../controllers/rateController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/rates          - Public
router.get('/', getAllRates);

// GET /api/rates/:id      - Public
router.get('/:id', getRateById);

// POST /api/rates         - Admin only
router.post('/', protect, adminOnly, createRate);

// PUT /api/rates/:id      - Admin only
router.put('/:id', protect, adminOnly, updateRate);

// DELETE /api/rates/:id   - Admin only
router.delete('/:id', protect, adminOnly, deleteRate);

export default router;
