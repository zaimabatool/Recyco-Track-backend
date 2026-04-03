import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

const avatars = [
    'FaUser', 'FaRobot', 'FaCat', 'FaDog', 'FaUserNinja', 
    'FaUserSecret', 'FaUserAstronaut', 'FaGhost', 'FaDragon', 'FaOtter'
];

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, phone, gender } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Pick a random avatar
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone: phone || '',
            gender: gender || 'Prefer not to say',
            avatar: randomAvatar
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                gender: user.gender,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                gender: user.gender,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                gender: user.gender,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { name, email, phone, gender, password, avatar } = req.body;

        // If updating email, check if it's already taken
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = email;
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (gender) user.gender = gender;
        if (avatar) user.avatar = avatar;
        
        // Explicit password update
        if (password && password.trim() !== '') {
            user.password = password;
        }

        await user.save();

        res.json({
            success: true,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                gender: user.gender,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
