import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ParticipantDashboard from './pages/participant/Dashboard';
import OrganizerDashboard from './pages/organizer/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes - Participant */}
          <Route 
            path="/participant/dashboard" 
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <ParticipantDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Protected Routes - Organizer */}
          <Route 
            path="/organizer/dashboard" 
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <OrganizerDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Protected Routes - Admin */}
          <Route 
            path="/admin/dashboard" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Default Route - Redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 - Redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
