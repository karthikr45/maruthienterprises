const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recovery-agency';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'manager', 'employee'], default: 'employee' },
    phone: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const users = [
  {
    name: 'Admin User',
    email: 'admin@maruthi.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '9876543210',
  },
  {
    name: 'Manager User',
    email: 'manager@maruthi.com',
    password: 'Manager@123',
    role: 'manager',
    phone: '9876543211',
  },
  {
    name: 'Employee User',
    email: 'employee@maruthi.com',
    password: 'Employee@123',
    role: 'employee',
    phone: '9876543212',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 12);
      await User.create({ ...userData, password: hashedPassword });
      console.log(`Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n--- Seed Credentials ---');
    console.log('Admin:    admin@maruthi.com    / Admin@123');
    console.log('Manager:  manager@maruthi.com  / Manager@123');
    console.log('Employee: employee@maruthi.com / Employee@123');
    console.log('------------------------\n');

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
