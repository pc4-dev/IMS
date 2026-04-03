import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models.ts';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neoteric-store';

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Ensure demo users exist
    const password = await bcrypt.hash('password123', 10);
    
    const demoUsers = [
      { name: 'Super Admin', email: 'superadmin@neoteric.com', password, role: 'Super Admin' },
      { name: 'Director', email: 'director@neoteric.com', password, role: 'Director' },
      { name: 'AGM', email: 'agm@neoteric.com', password, role: 'AGM' },
      { name: 'Project Manager', email: 'projectmanager@neoteric.com', password, role: 'Project Manager' },
      { name: 'Store Incharge', email: 'storeincharge@neoteric.com', password, role: 'Store Incharge' },
      { name: 'Accountant', email: 'accountant@neoteric.com', password, role: 'Accountant' },
    ];

    for (const demoUser of demoUsers) {
      const exists = await User.findOne({ email: demoUser.email });
      if (!exists) {
        console.log(`Seeding demo user: ${demoUser.email}`);
        await User.create(demoUser);
      }
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // process.exit(1);
  }
}
