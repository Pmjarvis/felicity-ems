# Felicity Event Management System

A comprehensive event management system built with the MERN stack for managing fest events, clubs, and participants.

## 🚀 Phase 1: Project Setup - Complete ✅

### Project Structure
```
felicity-ems/
├── backend/
│   ├── node_modules/
│   ├── .env
│   ├── .gitignore
│   ├── server.js
│   ├── package.json
│   └── MONGODB_SETUP.md
├── frontend/
│   ├── node_modules/
│   ├── src/
│   ├── public/
│   ├── .gitignore
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.js
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (MongoDB Atlas)
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Icons** - Icons

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- Git

## 🔧 Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd felicity-ems
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=admin@felicity.iiit.ac.in
ADMIN_PASSWORD=admin123456
```

**Important:** Follow the instructions in `backend/MONGODB_SETUP.md` to set up MongoDB Atlas and get your connection string.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:5173`

## ✅ Testing the Setup

1. Start both backend and frontend servers
2. Open `http://localhost:5173` in your browser
3. You should see the Felicity EMS welcome page
4. Click "Test Backend Connection" button
5. If successful, you'll see the backend welcome message

## 🔐 Default Admin Credentials

- Email: `admin@felicity.iiit.ac.in`
- Password: `admin123456`

**⚠️ Change these credentials in production!**

## 📦 Installed Packages

### Backend Dependencies
- express
- mongoose
- dotenv
- cors
- jsonwebtoken
- bcryptjs
- socket.io

### Backend Dev Dependencies
- nodemon

### Frontend Dependencies
- react
- react-dom
- axios
- react-router-dom
- socket.io-client
- tailwindcss
- postcss
- autoprefixer
- @mui/material
- @emotion/react
- @emotion/styled
- react-icons

## 🏗️ Next Steps

Phase 2 will include:
- Database models and schemas
- Authentication system
- User registration and login
- Protected routes
- Role-based access control

## 📝 Notes

- Make sure MongoDB Atlas is properly configured before running the backend
- The `.env` file should never be committed to Git
- Keep your JWT secret and database credentials secure

## 🤝 Contributing

This project is part of the DASS Assignment 1. Follow the assignment guidelines for development.

## 📄 License

This project is created for educational purposes as part of IIIT Hyderabad coursework.
