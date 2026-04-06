import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config({ path: './backend/.env' });

const createRider = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Check if rider already exists
        const existingRider = await User.findOne({ email: 'rider@recyco.com' });
        if (existingRider) {
            console.log('Rider account already exists:', existingRider.email);
            process.exit();
        }

        const rider = await User.create({
            name: 'Rider Specialist',
            email: 'rider@recyco.com',
            password: 'rider123',
            role: 'rider',
            phone: '0300-1234567',
            gender: 'Male',
            avatar: 'FaUserAlt'
        });

        console.log('--- RIDER CREATED ---');
        console.log('Email: rider@recyco.com');
        console.log('Password: rider123');
        console.log('---------------------');
        process.exit();
    } catch (error) {
        console.error('Error creating rider:', error.message);
        process.exit(1);
    }
};

createRider();
