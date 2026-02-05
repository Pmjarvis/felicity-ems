import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set axios default authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Load user data
      loadUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  // Load user data
  const loadUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Load user error:', err);
      // If token is invalid, clear it
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        // Save token to localStorage
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        // Save token to localStorage
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        
        return { success: true, message: response.data.message, user: newUser };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint (optional, mainly for server-side cleanup)
      if (token) {
        await axios.post('/auth/logout');
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local state and storage
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      const response = await axios.put('/auth/update-password', {
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update password';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      setError(null);
      // This will be implemented when profile routes are created
      setUser({ ...user, ...updates });
      return { success: true, message: 'Profile updated successfully' };
    } catch (err) {
      const errorMessage = 'Failed to update profile';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Check user role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Get dashboard route based on role
  const getDashboardRoute = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'organizer':
        return '/organizer/dashboard';
      case 'participant':
        return '/participant/dashboard';
      default:
        return '/';
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    updatePassword,
    updateProfile,
    isAuthenticated,
    hasRole,
    getDashboardRoute,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
