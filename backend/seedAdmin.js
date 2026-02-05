const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

/**
 * Seed script to create the initial Admin account
 * Run: node seedAdmin.js
 */
const seedAdmin = async () => {
  try {
    console.log('🌱 Starting Admin Seed Script...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Check if admin already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.iiit.ac.in';
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      console.log('\n💡 To reset password, delete this admin and run script again.\n');
      process.exit(0);
    }

    // Create admin account
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    
    console.log('🔐 Creating Admin Account...');
    
    const admin = new User({
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      contact: '1234567890',
      isActive: true,
      isApproved: true
    });
    
    await admin.save();

    console.log('\n✅ Admin Account Created Successfully!\n');
    console.log('=' .repeat(50));
    console.log('📋 ADMIN CREDENTIALS');
    console.log('=' .repeat(50));
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('=' .repeat(50));
    console.log('\n⚠️  IMPORTANT: Change these credentials after first login!\n');
    console.log('💡 You can now login at: http://localhost:5173/login\n');

  } catch (error) {
    console.error('❌ Seed Admin Error:', error.message);
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed\n');
    process.exit(0);
  }
};

// Run seed
seedAdmin();
