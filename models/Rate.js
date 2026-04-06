import mongoose from 'mongoose';

const rateSchema = new mongoose.Schema({
    material: {
        type: String,
        required: [true, 'Material name is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Metal', 'Plastic', 'Paper', 'E-Waste']
    },
    unit: {
        type: String,
        default: 'kg',
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    trend: {
        type: String,
        enum: ['up', 'down', 'stable'],
        default: 'stable'
    },
    iconType: {
        type: String,
        default: 'GiMetalBar'
    },
    iconColor: {
        type: String,
        default: 'text-gray-500'
    },
    minGrade: {
        type: String,
        enum: ['Premium', 'A Grade', 'B Grade', 'Standard', 'Poor'],
        default: 'Poor'
    }
}, {
    timestamps: true
});

const Rate = mongoose.model('Rate', rateSchema);
export default Rate;
