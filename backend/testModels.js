const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');

// Load env vars
dotenv.config();

// Import models
const { User, Event, Registration, Team, PasswordReset } = require('./models');

/**
 * Test script to verify all models are working correctly
 */
const testModels = async () => {
  try {
    console.log('🧪 Starting Model Verification Tests...\n'.cyan.bold);
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...'.yellow);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n'.green);
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: User Model
    console.log('1️⃣  Testing User Model...'.cyan);
    try {
      const testUser = new User({
        name: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        role: 'participant',
        participantType: 'IIIT',
        firstName: 'Test',
        lastName: 'User'
      });
      await testUser.validate();
      console.log('   ✅ User model validation passed'.green);
      testsPassed++;
    } catch (error) {
      console.log('   ❌ User model validation failed:'.red, error.message);
      testsFailed++;
    }
    
    // Test 2: Event Model
    console.log('2️⃣  Testing Event Model...'.cyan);
    try {
      const testEvent = new Event({
        name: 'Test Event',
        description: 'Test Description',
        type: 'Normal',
        organizer: new mongoose.Types.ObjectId(),
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
        registrationDeadline: new Date(Date.now() + 43200000),
        registrationFee: 100
      });
      await testEvent.validate();
      console.log('   ✅ Event model validation passed'.green);
      testsPassed++;
    } catch (error) {
      console.log('   ❌ Event model validation failed:'.red, error.message);
      testsFailed++;
    }
    
    // Test 3: Registration Model
    console.log('3️⃣  Testing Registration Model...'.cyan);
    try {
      const testRegistration = new Registration({
        event: new mongoose.Types.ObjectId(),
        user: new mongoose.Types.ObjectId(),
        ticketId: 'TEST-123',
        payment: {
          amount: 100,
          status: 'Completed'
        }
      });
      await testRegistration.validate();
      console.log('   ✅ Registration model validation passed'.green);
      testsPassed++;
    } catch (error) {
      console.log('   ❌ Registration model validation failed:'.red, error.message);
      testsFailed++;
    }
    
    // Test 4: Team Model
    console.log('4️⃣  Testing Team Model...'.cyan);
    try {
      const testTeam = new Team({
        name: 'Test Team',
        event: new mongoose.Types.ObjectId(),
        leader: new mongoose.Types.ObjectId(),
        inviteCode: 'TEST-CODE',
        requiredSize: 4
      });
      await testTeam.validate();
      console.log('   ✅ Team model validation passed'.green);
      testsPassed++;
    } catch (error) {
      console.log('   ❌ Team model validation failed:'.red, error.message);
      testsFailed++;
    }
    
    // Test 5: PasswordReset Model
    console.log('5️⃣  Testing PasswordReset Model...'.cyan);
    try {
      const testReset = new PasswordReset({
        organizer: new mongoose.Types.ObjectId(),
        reason: 'Forgot password'
      });
      await testReset.validate();
      console.log('   ✅ PasswordReset model validation passed'.green);
      testsPassed++;
    } catch (error) {
      console.log('   ❌ PasswordReset model validation failed:'.red, error.message);
      testsFailed++;
    }
    
    // Test 6: Password Hashing
    console.log('6️⃣  Testing Password Hashing...'.cyan);
    try {
      const user = new User({
        name: 'Hash Test',
        email: 'hash@test.com',
        password: 'password123',
        role: 'participant',
        participantType: 'IIIT'
      });
      
      const originalPassword = user.password;
      await user.save();
      
      if (user.password !== originalPassword && user.password.length > 20) {
        console.log('   ✅ Password hashing working correctly'.green);
        testsPassed++;
      } else {
        console.log('   ❌ Password not hashed properly'.red);
        testsFailed++;
      }
      
      // Clean up
      await User.deleteOne({ _id: user._id });
    } catch (error) {
      console.log('   ❌ Password hashing test failed:'.red, error.message);
      testsFailed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(50).gray);
    console.log('📊 Test Summary:'.cyan.bold);
    console.log(`   ✅ Tests Passed: ${testsPassed}`.green);
    console.log(`   ❌ Tests Failed: ${testsFailed}`.red);
    console.log(`   📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`.yellow);
    console.log('='.repeat(50).gray + '\n');
    
    if (testsFailed === 0) {
      console.log('🎉 All models are working correctly!'.green.bold);
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.'.yellow.bold);
    }
    
  } catch (error) {
    console.error('❌ Test script error:'.red.bold, error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed'.gray);
    process.exit(0);
  }
};

// Run tests
testModels();
