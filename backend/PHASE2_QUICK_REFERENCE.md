# Phase 2 - Quick Reference Guide

## ✅ What Was Created

### Models (5 files)
1. **User.js** - Handles Participant, Organizer, Admin with all fields
2. **Event.js** - Normal events, Merchandise, Team events with custom forms
3. **Registration.js** - Ticket system with QR codes and attendance tracking
4. **Team.js** - Team management for hackathons (Tier A)
5. **PasswordReset.js** - Password reset workflow for organizers (Tier B)

### Middleware (2 files)
1. **auth.js** - JWT token verification and user authentication
2. **checkRole.js** - Role-based access control (admin, organizer, participant)

### Utils (1 file)
1. **jwt.js** - Token generation and response utilities

### Testing
1. **testModels.js** - Model verification script

## 🧪 Verification Commands

### Test Models
```bash
cd backend
npm run test:models
```

### Check Server Still Works
```bash
npm run dev
# Server should start on port 5000
# MongoDB should connect successfully
```

## 📚 How to Use Models

### Import Models
```javascript
// Import all models
const { User, Event, Registration, Team, PasswordReset } = require('./models');

// Or import individually
const User = require('./models/User');
```

### Import Middleware
```javascript
// Import all middleware
const { auth, isAdmin, checkRole } = require('./middleware');

// Or import individually
const { auth } = require('./middleware/auth');
const { isAdmin } = require('./middleware/checkRole');
```

### Use in Routes (Future)
```javascript
const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('./middleware');

// Public route (no auth)
router.get('/events', getAllEvents);

// Protected route (auth required)
router.get('/profile', auth, getProfile);

// Admin only route
router.post('/admin/create-organizer', auth, isAdmin, createOrganizer);

// Multiple roles allowed
router.post('/events', auth, checkRole(['organizer', 'admin']), createEvent);
```

## 🔑 Key Features

### User Model
- ✅ Auto-hash passwords with bcrypt
- ✅ Email validation
- ✅ Separate fields for Participant vs Organizer
- ✅ Preferences (interests, followed clubs)
- ✅ Password comparison method

### Event Model
- ✅ Multiple event types (Normal, Merchandise)
- ✅ Dynamic custom form builder
- ✅ Team event support
- ✅ Registration limits and tracking
- ✅ Auto-validation (dates, limits)

### Registration Model
- ✅ Auto-generate unique ticket IDs
- ✅ QR code support
- ✅ Payment approval workflow
- ✅ Attendance tracking
- ✅ Custom form responses

### Team Model
- ✅ Invite system with unique codes
- ✅ Member status tracking
- ✅ Auto-finalization when complete
- ✅ Leader permissions

### PasswordReset Model
- ✅ Request/Approve/Reject workflow
- ✅ Admin comments and tracking
- ✅ Request history

## 🚫 No Manual Actions Needed

Everything is ready to use! The models:
- ✅ Connect to your MongoDB automatically
- ✅ Have proper indexes for performance
- ✅ Include validation rules
- ✅ Have helper methods
- ✅ Are tested and working

## 📝 Model Quick Reference

### Create User
```javascript
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123', // Will be auto-hashed
  role: 'participant',
  participantType: 'IIIT'
});
```

### Create Event
```javascript
const event = await Event.create({
  name: 'Workshop',
  description: 'Learn MERN',
  type: 'Normal',
  organizer: userId,
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-03-01'),
  registrationDeadline: new Date('2026-02-28'),
  registrationFee: 100
});
```

### Create Registration
```javascript
const registration = await Registration.create({
  event: eventId,
  user: userId,
  payment: { amount: 100, status: 'Completed' }
}); // ticketId auto-generated
```

### Create Team
```javascript
const team = await Team.create({
  name: 'Team Alpha',
  event: eventId,
  leader: userId,
  requiredSize: 4
}); // inviteCode auto-generated
```

### Password Reset Request
```javascript
const request = await PasswordReset.create({
  organizer: organizerId,
  reason: 'Forgot password'
});
```

## 🔐 Middleware Quick Reference

### Protect Route (Auth Required)
```javascript
router.get('/profile', auth, controller);
```

### Admin Only
```javascript
router.post('/admin/action', auth, isAdmin, controller);
```

### Organizer Only
```javascript
router.post('/events', auth, isOrganizer, controller);
```

### Multiple Roles
```javascript
router.get('/dashboard', auth, checkRole(['admin', 'organizer']), controller);
```

### Optional Auth (works with/without login)
```javascript
const { optionalAuth } = require('./middleware/auth');
router.get('/events', optionalAuth, controller);
// req.user will be null if not logged in
```

## 🎯 Next Phase Preview

Phase 3 will create:
- Authentication routes (signup, login)
- User CRUD routes
- Event CRUD routes
- Registration routes
- Team routes
- Admin routes

These routes will use the models and middleware we just created!

---

**Status:** ✅ All Phase 2 tasks complete - Ready for Phase 3!
