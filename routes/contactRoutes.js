import express from 'express';
import { body } from 'express-validator';
import { submitContactMessage, getContactMessages } from '../controllers/contactController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/contact   - Public (submit contact form)
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('subject').trim().notEmpty().withMessage('Subject is required'),
        body('message').trim().notEmpty().withMessage('Message is required')
    ],
    submitContactMessage
);

// GET /api/contact    - Admin only (view all messages)
router.get('/', protect, adminOnly, getContactMessages);

export default router;
