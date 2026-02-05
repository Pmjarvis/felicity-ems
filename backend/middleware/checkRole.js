/**
 * Role-Based Access Control Middleware
 * Usage: checkRole(['admin', 'organizer'])
 * Must be used AFTER auth middleware
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (auth middleware should run first)
    if (!req.user || !req.userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login first.'
      });
    }
    
    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    
    // User has the correct role, proceed
    next();
  };
};

/**
 * Middleware to check if user is admin
 * Shorthand for checkRole(['admin'])
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Middleware to check if user is organizer
 * Shorthand for checkRole(['organizer'])
 */
const isOrganizer = (req, res, next) => {
  if (!req.user || req.userRole !== 'organizer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Organizer privileges required.'
    });
  }
  next();
};

/**
 * Middleware to check if user is participant
 * Shorthand for checkRole(['participant'])
 */
const isParticipant = (req, res, next) => {
  if (!req.user || req.userRole !== 'participant') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Participant privileges required.'
    });
  }
  next();
};

/**
 * Middleware to check if user is admin or organizer
 * Common use case for management features
 */
const isAdminOrOrganizer = checkRole(['admin', 'organizer']);

/**
 * Middleware to check if user owns the resource
 * Useful for profile updates, etc.
 */
const isOwner = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Get resource owner ID from params, body, or query
    const resourceUserId = req.params[resourceUserIdField] || 
                          req.body[resourceUserIdField] || 
                          req.query[resourceUserIdField];
    
    // Check if user is the owner or an admin
    if (req.userId.toString() !== resourceUserId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if organizer owns the event
 * Must be used after event is loaded into req.event
 */
const isEventOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!req.event) {
    return res.status(500).json({
      success: false,
      message: 'Event not loaded. Internal error.'
    });
  }
  
  // Check if user is the event organizer or admin
  const eventOrganizerId = req.event.organizer._id || req.event.organizer;
  
  if (req.userId.toString() !== eventOrganizerId.toString() && req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only manage your own events.'
    });
  }
  
  next();
};

module.exports = {
  checkRole,
  isAdmin,
  isOrganizer,
  isParticipant,
  isAdminOrOrganizer,
  isOwner,
  isEventOrganizer
};
