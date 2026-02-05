// Central export for all models
const User = require('./User');
const Event = require('./Event');
const Registration = require('./Registration');
const Team = require('./Team');
const PasswordReset = require('./PasswordReset');

module.exports = {
  User,
  Event,
  Registration,
  Team,
  PasswordReset
};
