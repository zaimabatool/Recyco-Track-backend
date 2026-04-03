import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Rate from '../models/Rate.js';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding...');

        // ===== Clear existing data =====
        await User.deleteMany({});
        await Rate.deleteMany({});
        console.log('🗑️  Cleared existing users and rates');

        // ===== Seed Admin User =====
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@recycotrack.com',
            password: 'admin123',
            role: 'admin'
        });
        console.log(`👤 Admin created: ${adminUser.email} (password: admin123)`);

        // ===== Seed Demo User =====
        const demoUser = await User.create({
            name: 'Ali Khan',
            email: 'user@test.com',
            password: '123',
            phone: '03001234567',
            role: 'user'
        });
        console.log(`👤 Demo user created: ${demoUser.email} (password: 123)`);

        // ===== Seed Rates (matching frontend initialRates) =====
        const rates = [
            { material: 'Plastic Bottles (PET)', category: 'Plastic', unit: 'kg', price: 45, trend: 'up', iconType: 'GiSodaCan', iconColor: 'text-blue-500' },
            { material: 'Newspaper', category: 'Paper', unit: 'kg', price: 25, trend: 'stable', iconType: 'GiNewspaper', iconColor: 'text-gray-500' },
            { material: 'Cardboard', category: 'Paper', unit: 'kg', price: 18, trend: 'down', iconType: 'GiCardboardBox', iconColor: 'text-yellow-600' },
            { material: 'Iron', category: 'Metal', unit: 'kg', price: 60, trend: 'up', iconType: 'GiMetalBar', iconColor: 'text-gray-700' },
            { material: 'Steel', category: 'Metal', unit: 'kg', price: 55, trend: 'stable', iconType: 'GiSteelClaws', iconColor: 'text-gray-400' },
            { material: 'Aluminium', category: 'Metal', unit: 'kg', price: 180, trend: 'up', iconType: 'BiCylinder', iconColor: 'text-gray-300' },
            { material: 'Copper', category: 'Metal', unit: 'kg', price: 750, trend: 'up', iconType: 'BiCylinder', iconColor: 'text-orange-500' },
            { material: 'Brass', category: 'Metal', unit: 'kg', price: 480, trend: 'down', iconType: 'BiCylinder', iconColor: 'text-yellow-500' },
            { material: 'E-Waste (Mixed)', category: 'E-Waste', unit: 'kg', price: 35, trend: 'stable', iconType: 'GiCircuitry', iconColor: 'text-green-600' },
            { material: 'Batteries', category: 'E-Waste', unit: 'kg', price: 90, trend: 'up', iconType: 'GiBatteryPack', iconColor: 'text-red-600' },
            { material: 'CPU Processor', category: 'E-Waste', unit: 'pc', price: 250, trend: 'stable', iconType: 'BsCpu', iconColor: 'text-blue-600' },
        ];

        await Rate.insertMany(rates);
        console.log(`📊 ${rates.length} scrap rates seeded`);

        console.log('\n✅ Seeding complete!');
        console.log('─────────────────────────────────────');
        console.log('Admin Login:  admin@recycotrack.com / admin123');
        console.log('User Login:   user@test.com / 123');
        console.log('─────────────────────────────────────');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
        process.exit(1);
    }
};

seedData();
