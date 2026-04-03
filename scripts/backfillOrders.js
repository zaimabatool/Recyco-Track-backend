import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Counter from '../models/Counter.js';

dotenv.config();

const backfill = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const orders = await Order.find({ orderNumber: { $exists: false } }).sort({ createdAt: 1 });
        console.log(`Found ${orders.length} orders to backfill`);

        let count = 0;
        for (const order of orders) {
            count++;
            order.orderNumber = count;
            await order.save();
        }

        // Initialize counter
        await Counter.findOneAndUpdate(
            { id: 'orderNumber' },
            { seq: count },
            { upsert: true }
        );

        console.log(`Successfully backfilled ${count} orders`);
        process.exit(0);
    } catch (error) {
        console.error('Error during backfill:', error);
        process.exit(1);
    }
};

backfill();
