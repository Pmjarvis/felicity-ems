const nodemailer = require('nodemailer');

// Cached Ethereal transporter (created once, reused)
let _etherealTransporter = null;

// Create transporter — uses Gmail if configured, otherwise Ethereal (test mode)
const createTransporter = async () => {
  // If real Gmail credentials are provided, use them
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD &&
      process.env.EMAIL_USER !== 'your-email@gmail.com') {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Fallback: Ethereal test account (emails captured, viewable in browser)
  if (_etherealTransporter) return _etherealTransporter;

  console.log('📧 No Gmail credentials — creating Ethereal test account...');
  const testAccount = await nodemailer.createTestAccount();
  _etherealTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  console.log(`📧 Ethereal account: ${testAccount.user}`);
  console.log(`📧 View emails at: https://ethereal.email/login (user: ${testAccount.user}, pass: ${testAccount.pass})`);
  return _etherealTransporter;
};

// Helper: send mail and log Ethereal preview URL if applicable
const sendMail = async (transporter, mailOptions) => {
  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📨 Preview email: ${previewUrl}`);
  }
  return info;
};

// Send registration confirmation email
const sendRegistrationEmail = async (userEmail, userName, eventDetails, ticketNumber) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Felicity EMS" <${process.env.EMAIL_USER || 'noreply@felicity-ems.com'}>`,
      to: userEmail,
      subject: `Registration Confirmed: ${eventDetails.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .ticket-box { background: white; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .ticket-number { font-size: 24px; font-weight: bold; color: #667eea; text-align: center; font-family: monospace; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .detail-label { font-weight: bold; color: #666; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Registration Successful!</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>
              <p>Congratulations! You have successfully registered for <strong>${eventDetails.name}</strong>.</p>
              
              <div class="ticket-box">
                <h3 style="margin-top: 0; color: #667eea;">Your Event Ticket</h3>
                <div class="ticket-number">${ticketNumber}</div>
                <p style="text-align: center; margin: 10px 0; color: #666;">Please save this ticket number</p>
              </div>

              <h3>Event Details:</h3>
              <div class="detail-row">
                <span class="detail-label">Event Name:</span> ${eventDetails.name}
              </div>
              <div class="detail-row">
                <span class="detail-label">Organizer:</span> ${eventDetails.organizerName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span> ${new Date(eventDetails.startDate).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div class="detail-row">
                <span class="detail-label">Venue:</span> ${eventDetails.venue || 'To be announced'}
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Fee:</span> ₹${eventDetails.registrationFee || 0}
              </div>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <strong>📌 Important:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Keep your ticket number safe for attendance marking</li>
                  <li>Carry a valid ID to the event</li>
                  <li>Arrive 15 minutes before the event starts</li>
                </ul>
              </div>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/participant/dashboard" class="button">
                  View My Events
                </a>
              </center>

              <p style="margin-top: 30px;">For any queries, please contact the organizer at <a href="mailto:${eventDetails.organizerEmail}">${eventDetails.organizerEmail}</a></p>
              
              <p>Best regards,<br><strong>Felicity Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; 2026 Felicity Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendMail(transporter, mailOptions);
    console.log(`✅ Registration email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send team invitation email
const sendTeamInvitationEmail = async (toEmail, toName, teamDetails, inviteCode) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Felicity EMS" <${process.env.EMAIL_USER || 'noreply@felicity-ems.com'}>`,
      to: toEmail,
      subject: `Team Invitation: ${teamDetails.eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .invite-box { background: white; border: 2px solid #10b981; padding: 25px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .invite-code { font-size: 32px; font-weight: bold; color: #10b981; font-family: monospace; letter-spacing: 3px; margin: 15px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .detail-label { font-weight: bold; color: #666; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🤝 You're Invited to Join a Team!</h1>
            </div>
            <div class="content">
              <p>Hi ${toName},</p>
              <p><strong>${teamDetails.leaderName}</strong> has invited you to join their team <strong>"${teamDetails.teamName}"</strong> for the event <strong>${teamDetails.eventName}</strong>.</p>
              
              <div class="invite-box">
                <h3 style="margin-top: 0; color: #10b981;">Your Invite Code</h3>
                <div class="invite-code">${inviteCode}</div>
                <p style="color: #666; margin: 10px 0;">Use this code to join the team</p>
              </div>

              <h3>Team Details:</h3>
              <div class="detail-row">
                <span class="detail-label">Team Name:</span> ${teamDetails.teamName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Team Leader:</span> ${teamDetails.leaderName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Event:</span> ${teamDetails.eventName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Team Size:</span> ${teamDetails.currentSize} / ${teamDetails.maxSize}
              </div>

              <h3>How to Join:</h3>
              <ol style="padding-left: 20px;">
                <li>Log in to your Felicity EMS account</li>
                <li>Navigate to the event page for "${teamDetails.eventName}"</li>
                <li>Click on "Join Team"</li>
                <li>Enter the invite code: <strong>${inviteCode}</strong></li>
                <li>Click "Join" to become a team member</li>
              </ol>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/events/${teamDetails.eventId}" class="button">
                  Join Team Now
                </a>
              </center>

              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <strong>⏰ Note:</strong> Don't wait too long! The team leader can finalize the team once minimum members join.
              </div>
              
              <p>Best regards,<br><strong>Felicity Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; 2026 Felicity Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendMail(transporter, mailOptions);
    console.log(`✅ Team invitation email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Send team finalization email to all members
const sendTeamFinalizedEmail = async (memberEmail, memberName, teamDetails, ticketNumber) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Felicity EMS" <${process.env.EMAIL_USER || 'noreply@felicity-ems.com'}>`,
      to: memberEmail,
      subject: `Team Registration Complete: ${teamDetails.eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .ticket-box { background: white; border: 2px dashed #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .ticket-number { font-size: 24px; font-weight: bold; color: #8b5cf6; text-align: center; font-family: monospace; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .detail-label { font-weight: bold; color: #666; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .member-list { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎊 Team Registration Finalized!</h1>
            </div>
            <div class="content">
              <p>Hi ${memberName},</p>
              <p>Great news! Your team <strong>"${teamDetails.teamName}"</strong> has been successfully finalized and registered for <strong>${teamDetails.eventName}</strong>!</p>
              
              <div class="ticket-box">
                <h3 style="margin-top: 0; color: #8b5cf6;">Your Personal Ticket</h3>
                <div class="ticket-number">${ticketNumber}</div>
                <p style="text-align: center; margin: 10px 0; color: #666;">Each team member has a unique ticket</p>
              </div>

              <h3>Team Information:</h3>
              <div class="detail-row">
                <span class="detail-label">Team Name:</span> ${teamDetails.teamName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Team Leader:</span> ${teamDetails.leaderName}
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Members:</span> ${teamDetails.memberCount}
              </div>
              <div class="detail-row">
                <span class="detail-label">Event:</span> ${teamDetails.eventName}
              </div>

              <h3>Team Members:</h3>
              <div class="member-list">
                ${teamDetails.members.map((member, index) => 
                  `<div style="padding: 5px 0;">${index + 1}. ${member.name} ${member.isLeader ? '<strong>(Leader)</strong>' : ''}</div>`
                ).join('')}
              </div>

              <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <strong>📋 Next Steps:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>All team members have received their individual tickets</li>
                  <li>Each member should bring their ticket to the event</li>
                  <li>Coordinate with your team before the event</li>
                  <li>Arrive together if possible for a smooth check-in</li>
                </ul>
              </div>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/ticket/${ticketNumber}" class="button">
                  View My Ticket
                </a>
              </center>
              
              <p>Best regards,<br><strong>Felicity Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; 2026 Felicity Event Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendMail(transporter, mailOptions);
    console.log(`✅ Team finalized email sent to ${memberEmail}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendRegistrationEmail,
  sendTeamInvitationEmail,
  sendTeamFinalizedEmail,
  sendOrganizerWelcomeEmail,
  sendPasswordResetStatusEmail
};

// Send welcome email to new organizer with login credentials
async function sendOrganizerWelcomeEmail(email, name, password) {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `"Felicity EMS" <${process.env.EMAIL_USER || 'noreply@felicity-ems.com'}>`,
      to: email,
      subject: `Welcome to Felicity EMS - Your Organizer Account`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials-box { background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Felicity EMS!</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Your organizer account has been created. Here are your login credentials:</p>
              <div class="credentials-box">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
              </div>
              <p style="color: #e74c3c;"><strong>Important:</strong> Please request a password reset from the admin after your first login.</p>
              <p>Best regards,<br><strong>Felicity Admin Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Felicity Event Management System</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    await sendMail(transporter, mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Welcome email failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Send password reset status email to organizer
async function sendPasswordResetStatusEmail(email, name, status, details = {}) {
  try {
    const transporter = await createTransporter();
    const isApproved = status === 'Approved';
    const mailOptions = {
      from: `"Felicity EMS" <${process.env.EMAIL_USER || 'noreply@felicity-ems.com'}>`,
      to: email,
      subject: `Password Reset ${status} - Felicity EMS`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isApproved ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; border: 2px solid ${isApproved ? '#10b981' : '#ef4444'}; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset ${status}</h1>
            </div>
            <div class="content">
              <p>Dear ${name},</p>
              <p>Your password reset request has been <strong>${status.toLowerCase()}</strong>.</p>
              ${isApproved && details.newPassword ? `
              <div class="info-box">
                <p><strong>Your new password:</strong> ${details.newPassword}</p>
                <p style="color: #e74c3c;">Please change this password after logging in.</p>
              </div>` : ''}
              ${!isApproved && details.reason ? `
              <div class="info-box">
                <p><strong>Reason:</strong> ${details.reason}</p>
              </div>` : ''}
              <p>Best regards,<br><strong>Felicity Admin Team</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Felicity Event Management System</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    await sendMail(transporter, mailOptions);
    console.log(`✅ Password reset status email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Password reset email failed:', error.message);
    return { success: false, error: error.message };
  }
}
