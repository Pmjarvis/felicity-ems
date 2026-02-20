# Felicity Event Management System

A full-stack event management platform for IIIT Hyderabad's Felicity fest. Built so clubs can create and manage events, participants can browse, register, and attend — all without the usual chaos of Google Forms and WhatsApp groups.

**DASS Assignment 1 · MERN Stack**

---

## Table of Contents

1. [Tech Stack & Library Justifications](#tech-stack--library-justifications)
2. [Advanced Features Implemented](#advanced-features-implemented)
3. [Architecture & Design Decisions](#architecture--design-decisions)
4. [Setup & Installation](#setup--installation)
5. [Project Structure](#project-structure)
6. [User Roles & Flows](#user-roles--flows)
7. [API Endpoints](#api-endpoints)
8. [Database Schema Overview](#database-schema-overview)

---

## Tech Stack & Library Justifications

### Backend

| Library | Version | Why I chose it |
|---------|---------|----------------|
| **Express.js** | 5.2 | The standard Node.js web framework for REST APIs. v5 has built-in async error handling which saves boilerplate try-catch wrappers. |
| **Mongoose** | 9.1 | ODM for MongoDB — gives schema validation, middleware hooks (used for password hashing), and compound indexes (event+user uniqueness on registrations). |
| **bcryptjs** | 3.0 | Pure JS bcrypt implementation for hashing passwords. No native compilation needed, so it works across all environments without build issues. |
| **jsonwebtoken** | 9.0 | Industry-standard JWT library. Used for stateless auth — token contains user ID and role, so each request is self-contained without session storage. |
| **Socket.IO** | 4.8 | Real-time bidirectional communication for the discussion forum. Chose over raw WebSockets because it handles reconnection, fallbacks, and room-based messaging out of the box. |
| **Nodemailer** | 8.0 | Email sending for registration confirmations, team invitations, organizer welcome emails, and password reset notifications. Works with any SMTP provider. |
| **dotenv** | 17.2 | Loads environment variables from `.env` file. Keeps secrets (DB URI, JWT secret, SMTP credentials) out of source code. |
| **cors** | 2.8 | Enables Cross-Origin Resource Sharing so the React frontend (port 5173) can call the Express API (port 5000) during development. |
| **nodemon** | 3.1 (dev) | Auto-restarts the server on file changes during development. |

### Frontend

| Library | Version | Why I chose it |
|---------|---------|----------------|
| **React** | 19.2 | Component-based UI library. Hooks (`useState`, `useEffect`, `useContext`) make state management clean without Redux overhead for this project size. |
| **Vite** | 7.2 | Much faster HMR and build times compared to Create React App. Native ES module support means near-instant dev server startup. |
| **Tailwind CSS** | 4.1 | Utility-first CSS — lets me style directly in JSX without switching between files. Responsive design via `md:`, `lg:` prefixes. |
| **Material UI** | 7.3 | Used selectively for complex components (date pickers, dialogs). Tailwind handles most styling, MUI fills gaps for interactive widgets. |
| **React Router** | 7.13 | Client-side routing with `<PrivateRoute>` wrappers for role-based access control. Supports nested routes and URL params. |
| **Axios** | 1.13 | HTTP client with interceptor support. I set a global `baseURL` and attach JWT tokens via interceptors in `AuthContext`, so individual components don't manage auth headers. |
| **Socket.IO Client** | 4.8 | Pairs with backend Socket.IO for real-time discussion forum. Handles automatic reconnection. |
| **qrcode.react** | 4.2 | Renders QR codes as React components on tickets. Encodes ticket IDs for scanner validation. |
| **@zxing/library** | 0.21 | Browser-based barcode/QR scanner using device camera. Used in the organizer QR Scanner page for attendance tracking. |
| **add-to-calendar-button** | 2.13 | Generates `.ics` files and direct links for Google Calendar / Outlook. Simple web component integration. |
| **react-icons** | 5.5 | Consistent icon set across the UI (navigation, status indicators, action buttons). |

### Database

- **MongoDB Atlas** — Cloud-hosted MongoDB. Chosen because the assignment requires MongoDB, and Atlas provides free-tier hosting with built-in backups.

---

## Advanced Features Implemented

### Tier A (8 marks each — chose 2)

#### 1. Hackathon Team Registration
- Team leader creates a team specifying event and team size
- System generates a unique invite code (`TEAM-XXXXXXXX`)
- Members join using the invite code
- Leader finalizes the team once all members have joined
- On finalization, registration records + unique tickets are auto-generated for every team member
- Team management UI on the Event Details page (create/join/view team, member list)
- **Design choice**: Invite codes over email invites — simpler UX, works even if members don't have accounts yet at invite time

#### 2. QR Scanner & Attendance Tracking
- Organizers scan participant QR codes using their device camera on `/organizer/scan/:eventId`
- Uses `@zxing/library` for real-time camera-based QR decoding
- Backend validates ticket: checks if ticket exists, belongs to the correct event, user is registered, and hasn't already been scanned
- Marks attendance with timestamp, rejects duplicate scans
- Live attendance dashboard showing scanned count vs total registered
- Attendance data available in event detail analytics and CSV export
- **Design choice**: Built-in browser scanner rather than native app — works on any device with a camera, no installation needed

### Tier B (6 marks each — chose 2)

#### 3. Real-Time Discussion Forum
- Available on the Event Details page for registered participants
- Real-time messaging via Socket.IO (room per event)
- Organizers can pin important messages and delete inappropriate ones
- Messages persist in MongoDB so history is available on page load
- Socket rooms scoped by event ID to prevent cross-event message leaks
- **Design choice**: Socket.IO rooms over polling — true real-time without hammering the server with repeated requests

#### 4. Organizer Password Reset Workflow
- Organizers request a password reset from their profile (since they can't self-reset — accounts are admin-provisioned)
- Admin sees all pending requests on the Password Resets page
- Admin can approve (system auto-generates new password) or reject (with comments)
- On approval, email with new credentials is sent to the organizer
- Full status tracking: Pending → Approved/Rejected
- **Design choice**: Admin-mediated rather than email-link-based reset — matches the assignment spec where organizer accounts are admin-controlled

### Tier C (2 marks — chose 1)

#### 5. Add to Calendar Integration
- On registered events, participants see an "Add to Calendar" button
- Generates downloadable `.ics` files for universal calendar import
- Direct integration links for Google Calendar and Microsoft Outlook
- Uses the `add-to-calendar-button` web component
- **Design choice**: Web component approach — one library handles all three calendar formats without separate implementations

---

## Architecture & Design Decisions

### Authentication Flow
1. User registers/logs in → backend returns JWT token
2. Token stored in `localStorage` for session persistence across browser restarts
3. `AuthContext` sets the token as Axios default header (`Authorization: Bearer <token>`)
4. Every API call automatically includes the token
5. Backend `auth` middleware verifies the token and attaches `req.user`
6. `checkRole` middleware enforces role-based access on protected routes

### Single User Model
Instead of separate collections for participants/organizers/admins, I use a single `User` collection with a `role` field. Fields specific to a role (like `organizerName` for organizers or `preferences` for participants) are optional. This simplifies auth — one login endpoint, one token format, one middleware.

### Registration with Auto-Generated Tickets
When a participant registers for an event, the system auto-generates:
- A unique ticket ID (`FEL-YYYYMMDD-XXXXXX`)
- A QR code containing the ticket ID
- Both are stored on the Registration document and sent via email

### Event Status Lifecycle
`Draft` → `Published` → `Ongoing` → `Completed`/`Closed`

Editing rules change by status:
- **Draft**: All fields editable, can delete
- **Published**: Only description, deadline extension, limit increase
- **Ongoing/Completed**: Only status transitions

### Custom Registration Forms
Organizers can add custom fields (text, email, number, textarea, dropdown, checkbox) when creating events. The form schema is stored in `Event.customForm.fields[]`. When participants register, the dynamic form renders based on this schema, and responses are stored as a `Map` on the Registration document.

### Global Navbar
The `<Navbar>` component is rendered once in `App.jsx` above all routes. It reads the user's role from `AuthContext` and renders the appropriate navigation links (participant/organizer/admin/public). This avoids duplicating navigation logic across 15+ pages.

---

## Setup & Installation

### Prerequisites
- Node.js v16+
- npm
- MongoDB Atlas account (or local MongoDB)

### 1. Clone and install

```bash
git clone <repository-url>
cd felicity-ems

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/felicity-ems
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173

# Admin account (auto-created on first start)
ADMIN_EMAIL=admin@felicity.iiit.ac.in
ADMIN_PASSWORD=admin123456

# Email (optional — used for registration confirmations)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Felicity EMS <noreply@felicity.iiit.ac.in>
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Seed admin and start

```bash
# Terminal 1 — Backend
cd backend
npm run seed:admin   # Creates the admin user
npm run dev          # Starts on port 5000

# Terminal 2 — Frontend
cd frontend
npm run dev          # Starts on port 5173
```

### 4. Login
- **Admin**: Use the email/password from your `.env` file
- **Participant**: Register from the signup page
- **Organizer**: Admin creates organizer accounts from the dashboard

---

## Project Structure

```
felicity-ems/
├── backend/
│   ├── server.js              # Express app, Socket.IO setup, MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT verification middleware
│   │   ├── checkRole.js       # Role-based access control
│   │   └── index.js           # Barrel export
│   ├── models/
│   │   ├── User.js            # Single model for all 3 roles
│   │   ├── Event.js           # Events with custom forms, merchandise
│   │   ├── Registration.js    # Tickets, payments, attendance, QR codes
│   │   ├── Team.js            # Hackathon team management
│   │   ├── Message.js         # Discussion forum messages
│   │   ├── PasswordReset.js   # Organizer password reset requests
│   │   └── index.js           # Barrel export
│   ├── routes/
│   │   ├── auth.js            # Login, register, profile
│   │   ├── events.js          # CRUD + search/filter + trending
│   │   ├── registrations.js   # Register, cancel, CSV export
│   │   ├── teams.js           # Create, join, finalize teams
│   │   ├── tickets.js         # QR validation & attendance
│   │   ├── messages.js        # Discussion forum REST endpoints
│   │   ├── admin.js           # Organizer management, password resets
│   │   ├── organizer.js       # Profile, stats, password reset requests
│   │   └── users.js           # Clubs listing, follow/unfollow
│   ├── utils/
│   │   ├── emailService.js    # Nodemailer templates
│   │   └── jwt.js             # Token generation helper
│   └── seedAdmin.js           # One-time admin account creation
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Router + global Navbar + route definitions
│   │   ├── main.jsx           # React entry point
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state, Axios interceptors, login/logout
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # Role-aware navigation bar
│   │   │   ├── PrivateRoute.jsx   # Route guard by role
│   │   │   ├── DiscussionForum.jsx # Socket.IO chat component
│   │   │   └── AddToCalendar.jsx  # Calendar export button
│   │   └── pages/
│   │       ├── Login.jsx / Register.jsx / ForgotPassword.jsx
│   │       ├── participant/
│   │       │   ├── Dashboard.jsx     # Registered events with tabs
│   │       │   ├── BrowseEvents.jsx  # Search, filter, trending
│   │       │   ├── EventDetails.jsx  # Details + register + team + forum
│   │       │   ├── MyTicket.jsx      # Ticket with QR code
│   │       │   ├── Profile.jsx       # Edit profile & preferences
│   │       │   └── ClubsListing.jsx  # Follow/unfollow organizers
│   │       ├── organizer/
│   │       │   ├── Dashboard.jsx       # Event cards + analytics
│   │       │   ├── CreateEvent.jsx     # Multi-step event creation wizard
│   │       │   ├── EditEvent.jsx       # Status-based editing
│   │       │   ├── MyEvents.jsx        # Event list with filters
│   │       │   ├── QRScanner.jsx       # Camera-based ticket scanner
│   │       │   └── OrganizerProfile.jsx # Profile + Discord webhook
│   │       └── admin/
│   │           ├── Dashboard.jsx       # System stats
│   │           ├── ManageOrganizers.jsx # CRUD organizer accounts
│   │           └── PasswordResets.jsx   # Approve/reject requests
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── README.md
└── deployment.txt
```

---

## User Roles & Flows

### Participant
1. Register (IIIT email validation for IIIT students) → select interests/follow clubs (optional)
2. Browse events → search/filter → view details
3. Register for event → fill custom form → receive ticket with QR via email
4. For team events: create team / join via code → leader finalizes → tickets for all
5. View registered events on dashboard (upcoming / completed / cancelled tabs)
6. Attend event → organizer scans QR → attendance marked
7. Use discussion forum on event pages to chat with other participants

### Organizer
1. Admin creates account → organizer receives login credentials via email
2. Create event (4-step wizard): basic info → dates → registration settings → custom form
3. Publish event → participants can register
4. View registrations, attendance stats, revenue analytics
5. Scan QR codes at events to mark attendance
6. Export participant lists as CSV
7. Moderate discussion forum (pin/delete messages)
8. Request password reset from admin if needed

### Admin
1. Backend provisions admin account on first start (`seedAdmin.js`)
2. Create/disable organizer accounts
3. Approve/reject organizer password reset requests
4. View system-wide stats

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Participant registration |
| POST | `/login` | Login (all roles) |
| GET | `/me` | Get current user profile |
| PUT | `/update-profile` | Update profile fields |
| PUT | `/change-password` | Change password |

### Events (`/api/events`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create event (organizer) |
| GET | `/` | Browse events (search, filter, trending) |
| GET | `/:id` | Event details (increments view count) |
| PUT | `/:id` | Edit event (status-based restrictions) |
| DELETE | `/:id` | Delete draft event |
| GET | `/organizer/my-events` | Organizer's own events |

### Registrations (`/api/registrations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Register for event |
| GET | `/my` | My registrations |
| GET | `/event/:eventId` | Event registrations (organizer) |
| GET | `/event/:eventId/export` | Export CSV (organizer) |
| DELETE | `/:id` | Cancel registration |
| GET | `/ticket/:ticketId` | Lookup ticket by ID |

### Teams (`/api/teams`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create team |
| POST | `/join` | Join via invite code |
| POST | `/finalize/:teamId` | Finalize team (leader) |
| GET | `/my-teams` | My teams |
| GET | `/:teamId` | Team details |

### Tickets (`/api/tickets`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/validate` | Validate QR code & mark attendance |
| GET | `/event/:eventId/attendance` | Attendance list |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/organizers` | Create organizer account |
| GET | `/organizers` | List all organizers |
| DELETE | `/organizers/:id` | Disable organizer |
| GET | `/password-resets` | List reset requests |
| POST | `/password-resets/:id/approve` | Approve reset |
| POST | `/password-resets/:id/reject` | Reject reset |

### Messages (`/api/messages`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/event/:eventId` | Get event messages |

Real-time messaging is handled via Socket.IO events (`joinEvent`, `sendMessage`, `pinMessage`, `deleteMessage`).

---

## Database Schema Overview

### User
Single collection, discriminated by `role` field. Key indexes: `email` (unique).

### Event
Supports Normal and Merchandise types. Custom form fields stored as an array of `{fieldName, fieldType, required, options}`. Status enum controls the event lifecycle.

### Registration
Links User ↔ Event. Compound unique index `{event, user}` prevents duplicate registrations. Auto-generates `ticketId` (format: `FEL-YYYYMMDD-XXXXXX`). Nested `payment` and `attendance` sub-documents track transaction and scan data.

### Team
Stores team members as array of User refs. `inviteCode` (format: `TEAM-XXXXXXXX`) enables join-by-code. `isFinalized` flag triggers bulk registration creation.

### Message
Stores discussion messages per event. Supports `isPinned` and `isDeleted` (soft delete) flags for moderation.

### PasswordReset
Tracks organizer password reset requests with status lifecycle (Pending → Approved/Rejected) and admin comments.
