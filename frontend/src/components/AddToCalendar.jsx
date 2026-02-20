import React from 'react';
import PropTypes from 'prop-types';

const AddToCalendar = ({ event }) => {
  // Format date for calendar (YYYYMMDDTHHMMSS format)
  const formatDateForCalendar = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const generateGoogleCalendarUrl = () => {
    const startDate = formatDateForCalendar(event.startDate);
    const endDate = formatDateForCalendar(event.endDate);
    const title = encodeURIComponent(event.name);
    const description = encodeURIComponent(
      `${event.description}\n\nRegistration Fee: ₹${event.registrationFee}\n\nOrganized by: ${event.organizer?.organizerName || 'N/A'}`
    );
    const location = encodeURIComponent(event.venue || 'Online');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${description}&location=${location}`;
  };

  const generateOutlookCalendarUrl = () => {
    const startDate = new Date(event.startDate).toISOString();
    const endDate = new Date(event.endDate).toISOString();
    const title = encodeURIComponent(event.name);
    const description = encodeURIComponent(
      `${event.description}\n\nRegistration Fee: ₹${event.registrationFee}\n\nOrganized by: ${event.organizer?.organizerName || 'N/A'}`
    );
    const location = encodeURIComponent(event.venue || 'Online');

    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDate}&enddt=${endDate}&body=${description}&location=${location}`;
  };

  const downloadICSFile = () => {
    const startDate = new Date(event.startDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(event.endDate).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Felicity EMS//Event Calendar//EN',
      'BEGIN:VEVENT',
      `DTSTART:${startDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${event.description}\\n\\nRegistration Fee: ₹${event.registrationFee}\\n\\nOrganized by: ${event.organizer?.organizerName || 'N/A'}`,
      `LOCATION:${event.venue || 'Online'}`,
      `STATUS:CONFIRMED`,
      `SEQUENCE:0`,
      `UID:${event._id}@felicity-ems.com`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.name.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="add-to-calendar-container" style={styles.container}>
      <h3 style={styles.title}>📅 Add to Calendar</h3>
      <p style={styles.subtitle}>Never miss this event! Add it to your calendar:</p>
      
      <div style={styles.buttonGroup}>
        <a
          href={generateGoogleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.button}
          className="calendar-btn google"
        >
          <span style={styles.icon}>📆</span>
          Google Calendar
        </a>

        <a
          href={generateOutlookCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.button}
          className="calendar-btn outlook"
        >
          <span style={styles.icon}>📧</span>
          Outlook Calendar
        </a>

        <button
          onClick={downloadICSFile}
          style={styles.button}
          className="calendar-btn ics"
        >
          <span style={styles.icon}>⬇️</span>
          Download ICS
        </button>
      </div>

      <p style={styles.info}>
        💡 <strong>Tip:</strong> ICS files work with Apple Calendar, Outlook, and most calendar applications.
      </p>

      <style>{`
        .calendar-btn {
          transition: all 0.3s ease;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }

        .calendar-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .calendar-btn.google:hover {
          background: linear-gradient(135deg, #4285f4, #34a853);
        }

        .calendar-btn.outlook:hover {
          background: linear-gradient(135deg, #0078d4, #106ebe);
        }

        .calendar-btn.ics:hover {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '24px',
    marginTop: '24px',
    color: 'white',
    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '20px',
    textAlign: 'center',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  icon: {
    fontSize: '18px',
  },
  info: {
    fontSize: '13px',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '10px',
    borderRadius: '6px',
    marginTop: '8px',
  },
};

AddToCalendar.propTypes = {
  event: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    registrationFee: PropTypes.number.isRequired,
    venue: PropTypes.string,
    organizer: PropTypes.shape({
      organizerName: PropTypes.string,
    }),
  }).isRequired,
};

export default AddToCalendar;
