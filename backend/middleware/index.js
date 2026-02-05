// Central export for all middleware
const { auth, optionalAuth } = require('./auth');
const {
  checkRole,
  isAdmin,
  isOrganizer,
  isParticipant,
  isAdminOrOrganizer,
  isOwner,
  isEventOrganizer
} = require('./checkRole');

module.exports = {
  auth,
  optionalAuth,
  checkRole,
  isAdmin,
  isOrganizer,
  isParticipant,
  isAdminOrOrganizer,
  isOwner,
  isEventOrganizer
};
