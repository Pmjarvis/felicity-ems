import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ParticipantDashboard from './pages/participant/Dashboard';
import OrganizerDashboard from './pages/organizer/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

// Admin Pages
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResets from './pages/admin/PasswordResets';

// Organizer Pages
import CreateEvent from './pages/organizer/CreateEvent';
import MyEvents from './pages/organizer/MyEvents';
import EditEvent from './pages/organizer/EditEvent';
import OrganizerProfile from './pages/organizer/OrganizerProfile';
import QRScanner from './pages/organizer/QRScanner';

// Participant Pages
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import MyTicket from './pages/participant/MyTicket';
import Profile from './pages/participant/Profile';
import ClubsListing from './pages/participant/ClubsListing';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes - All Authenticated Users */}
          <Route
            path="/browse-events"
            element={
              <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                <BrowseEvents />
              </PrivateRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                <EventDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/ticket/:ticketId"
            element={
              <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                <MyTicket />
              </PrivateRoute>
            }
          />
          <Route
            path="/clubs"
            element={
              <PrivateRoute allowedRoles={['participant', 'organizer', 'admin']}>
                <ClubsListing />
              </PrivateRoute>
            }
          />

          {/* Protected Routes - Participant */}
          <Route
            path="/participant/dashboard"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <ParticipantDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/participant/profile"
            element={
              <PrivateRoute allowedRoles={['participant']}>
                <Profile />
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
            path="/organizer/events/:id/edit"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <EditEvent />
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
          <Route
            path="/organizer/scan/:eventId"
            element={
              <PrivateRoute allowedRoles={['organizer']}>
                <QRScanner />
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
