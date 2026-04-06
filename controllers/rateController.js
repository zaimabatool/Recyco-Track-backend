import Rate from '../models/Rate.js';

/**
 * @desc    Get all rates (public)
 * @route   GET /api/rates
 * @access  Public
 */
export const getAllRates = async (req, res) => {
    try {
        const { category, search } = req.query;

        let filter = {};

        // Filter by category
        if (category && category !== 'All') {
            filter.category = category;
        }

        // Search by material name
        if (search) {
            filter.material = { $regex: search, $options: 'i' };
        }

        const rates = await Rate.find(filter).sort({ category: 1, material: 1 });

        // Map _id to id for frontend compatibility
        const formattedRates = rates.map(rate => ({
            ...rate.toObject(),
            id: rate._id
        }));

        res.json({
            success: true,
            count: formattedRates.length,
            rates: formattedRates
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get single rate
 * @route   GET /api/rates/:id
 * @access  Public
 */
export const getRateById = async (req, res) => {
    try {
        const rate = await Rate.findById(req.params.id);

        if (!rate) {
            return res.status(404).json({ success: false, message: 'Rate not found' });
        }

        res.json({
            success: true,
            rate: { ...rate.toObject(), id: rate._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create a new rate
 * @route   POST /api/rates
 * @access  Admin
 */
export const createRate = async (req, res) => {
    try {
        const { material, category, unit, price, trend, iconType, iconColor, minGrade } = req.body;
 
         const rate = await Rate.create({
             material,
             category,
             unit: unit || 'kg',
             price,
             trend: trend || 'stable',
             iconType: iconType || 'GiMetalBar',
             iconColor: iconColor || 'text-gray-500',
             minGrade: minGrade || 'Poor'
         });

        res.status(201).json({
            success: true,
            rate: { ...rate.toObject(), id: rate._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update a rate
 * @route   PUT /api/rates/:id
 * @access  Admin
 */
export const updateRate = async (req, res) => {
    try {
        const rate = await Rate.findById(req.params.id);

        if (!rate) {
            return res.status(404).json({ success: false, message: 'Rate not found' });
        }

        const updatedRate = await Rate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            rate: { ...updatedRate.toObject(), id: updatedRate._id }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete a rate
 * @route   DELETE /api/rates/:id
 * @access  Admin
 */
export const deleteRate = async (req, res) => {
    try {
        const rate = await Rate.findById(req.params.id);

        if (!rate) {
            return res.status(404).json({ success: false, message: 'Rate not found' });
        }

        await Rate.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Rate deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
