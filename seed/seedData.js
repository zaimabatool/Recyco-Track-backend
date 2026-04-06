import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Rate from '../models/Rate.js';
import Order from '../models/Order.js';

dotenv.config();

const seedData = async () => {
    try {
        console.log('⏳ Connecting to MongoDB: ' + process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding...');

        // ===== Clear existing data =====
        await User.deleteMany({});
        await Rate.deleteMany({});
        await Order.deleteMany({});
        console.log('🗑️  Cleared existing Users, Rates, and Orders');

        // ===== Seed Admin User =====
        const adminUser = await User.create({
            name: 'System Admin',
            email: 'admin@recyco.com',
            password: 'admin123',
            role: 'admin'
        });
        console.log(`👤 Admin created: ${adminUser.email} (password: admin123)`);

        // ===== Seed Rider User =====
        const riderUser = await User.create({
            name: 'Rider Expert',
            email: 'rider@recyco.com',
            password: 'rider123',
            phone: '0300-1112223',
            role: 'rider'
        });
        console.log(`👤 Rider created: ${riderUser.email} (password: rider123)`);

        // ===== Seed Regular User =====
        const regularUser = await User.create({
            name: 'Shahbaz NTU',
            email: 'user@recyco.com',
            password: 'user123',
            phone: '0300-4445556',
            role: 'user'
        });
        console.log(`👤 Regular User created: ${regularUser.email} (password: user123)`);

        // ===== Seed Scrap Rates =====
        const rates = [
            { material: 'Plastic Bottles (PET)', category: 'Plastic', unit: 'kg', price: 45, trend: 'up', iconType: 'GiSodaCan', iconColor: 'text-blue-500' },
            { material: 'Newspaper', category: 'Paper', unit: 'kg', price: 25, trend: 'stable', iconType: 'GiNewspaper', iconColor: 'text-gray-500' },
            { material: 'Cardboard', category: 'Paper', unit: 'kg', price: 18, trend: 'down', iconType: 'GiCardboardBox', iconColor: 'text-yellow-600' },
            { material: 'Iron', category: 'Metal', unit: 'kg', price: 60, trend: 'up', iconType: 'GiMetalBar', iconColor: 'text-gray-700' },
            { material: 'Steel', category: 'Metal', unit: 'kg', price: 55, trend: 'stable', iconType: 'GiSteelClaws', iconColor: 'text-gray-400' },
            { material: 'Aluminium', category: 'Metal', unit: 'kg', price: 180, trend: 'up', iconType: 'BiCylinder', iconColor: 'text-gray-300' },
            { material: 'Copper', category: 'Metal', unit: 'kg', price: 750, trend: 'up', iconType: 'BiCylinder', iconColor: 'text-orange-500' },
            { material: 'E-Waste (Mixed)', category: 'E-Waste', unit: 'kg', price: 35, trend: 'stable', iconType: 'GiCircuitry', iconColor: 'text-green-600' },
            { material: 'Batteries', category: 'E-Waste', unit: 'kg', price: 90, trend: 'up', iconType: 'GiBatteryPack', iconColor: 'text-red-600' },
        ];
        await Rate.insertMany(rates);
        console.log(`📊 ${rates.length} Scrap Rates re-inserted`);

        // ===== Seed Dummy Orders =====
        const dummyOrders = [
            {
                orderNumber: 1001,
                userId: regularUser._id,
                customerName: regularUser.name,
                customerPhone: regularUser.phone,
                materialName: 'Iron Scrap',
                weight: 15,
                amount: 900,
                status: 'Pending',
                paymentMethod: 'cash',
                items: [
                   { material: 'Iron', weight: 15, unit: 'kg', price: 60 }
                ],
                date: new Date()
            },
            {
                orderNumber: 1002,
                userId: regularUser._id,
                customerName: regularUser.name,
                customerPhone: regularUser.phone,
                materialName: 'PET Bottles',
                weight: 10,
                amount: 450,
                status: 'Scheduled',
                pickupTime: 'Nov 20 - Nov 20, 14:00 to 16:00',
                riderId: riderUser._id,
                paymentMethod: 'cash',
                items: [
                    { material: 'Plastic Bottles (PET)', weight: 10, unit: 'kg', price: 45 }
                ],
                date: new Date(Date.now() - 1000 * 60 * 60 * 24) // Yesterday
            },
            {
                orderNumber: 1003,
                userId: regularUser._id,
                customerName: regularUser.name,
                customerPhone: regularUser.phone,
                materialName: 'Mixed Paper',
                weight: 20,
                amount: 500,
                status: 'Completed',
                finalWeight: 20,
                finalPrice: 500,
                riderId: riderUser._id,
                paymentMethod: 'online',
                paymentDetails: {
                    accountNumber: '0123456789',
                    accountName: 'Shahbaz NTU'
                },
                items: [
                    { material: 'Newspaper', weight: 20, unit: 'kg', price: 25 }
                ],
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
            }
        ];

        await Order.insertMany(dummyOrders);
        console.log(`📦 3 Dummy Orders (Pending, Scheduled, Completed) seeded`);

        console.log('\n🚀  SEEDING SUCCESSFUL!');
        console.log('─────────────────────────────────────');
        console.log('ADMIN LOGIN:  admin@recyco.com / admin123');
        console.log('RIDER LOGIN:  rider@recyco.com / rider123');
        console.log('USER LOGIN:   user@recyco.com / user123');
        console.log('─────────────────────────────────────');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
        process.exit(1);
    }
};

seedData();
