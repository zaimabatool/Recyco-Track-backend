import ContactMessage from '../models/ContactMessage.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Submit a contact form message
 * @route   POST /api/contact
 * @access  Public
 */
export const submitContactMessage = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, subject, message } = req.body;

        const contactMessage = await ContactMessage.create({
            name,
            email,
            subject,
            message
        });

        res.status(201).json({
            success: true,
            message: 'Message sent successfully! We will get back to you soon.',
            data: contactMessage
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all contact messages (admin)
 * @route   GET /api/contact
 * @access  Admin
 */
export const getContactMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            count: messages.length,
            messages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
