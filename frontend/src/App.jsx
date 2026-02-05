import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ParticipantDashboard from './pages/participant/Dashboard';
import OrganizerDashboard from './pages/organizer/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

// Admin Pages
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResets from './pages/admin/PasswordResets';

// Organizer Pages
import CreateEvent from './pages/organizer/CreateEvent';
import MyEvents from './pages/organizer/MyEvents';
import OrganizerProfile from './pages/organizer/OrganizerProfile';

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
          <Route 
            path="/organizer/create-event" 
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <CreateEvent />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/organizer/events" 
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <MyEvents />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/organizer/profile" 
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <OrganizerProfile />
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
          <Route 
            path="/admin/organizers" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <ManageOrganizers />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin/password-resets" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <PasswordResets />
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
