import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import AddEvent from './addEvent.tsx';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

function getGoogleClientId() {
  return process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
}

function decodeJwt(credential) {
  try {
    const payload = credential.split('.')[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

function App() {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [events, setEvents] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [googleError, setGoogleError] = useState('');
  const [user, setUser] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const googleButtonRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      setGoogleError(
        'Google Sign-In is not configured. Set REACT_APP_GOOGLE_CLIENT_ID in your environment.'
      );
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 260
      });
    };

    const initializeGoogle = () => {
      if (!window.google) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            setGoogleError('Google Sign-In failed. Please try again.');
            return;
          }

          const parsedUser = decodeJwt(response.credential);
          if (!parsedUser) {
            setGoogleError('Could not read Google account details.');
            return;
          }

          setGoogleError('');
          setUser({
            name: parsedUser.name || 'Google User',
            email: parsedUser.email || '',
            picture: parsedUser.picture || ''
          });
        }
      });

      renderGoogleButton();
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.id = GOOGLE_SCRIPT_ID;
    script.onload = initializeGoogle;
    script.onerror = () => {
      setGoogleError('Unable to load Google Sign-In. Please refresh and try again.');
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!user && window.google) {
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          width: 260
        });
      }
      window.google.accounts.id.prompt();
    }
  }, [user]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isProfileMenuOpen]);

  const handleSignOut = () => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    setShowAddEvent(false);
    setIsProfileMenuOpen(false);
    setUser(null);
  };

  const handleChangeAccount = () => {
    if (window.google && user?.email) {
      window.google.accounts.id.revoke(user.email, () => {
        window.google.accounts.id.disableAutoSelect();
        setShowAddEvent(false);
        setIsProfileMenuOpen(false);
        setUser(null);
      });
      return;
    }

    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    setShowAddEvent(false);
    setIsProfileMenuOpen(false);
    setUser(null);
  };

  const handleCreateEvent = (newEvent) => {
    setEvents((previousEvents) => [
      ...previousEvents,
      { ...newEvent, id: Date.now().toString() }
    ]);
  };

  const toggleEventExpanded = (eventId) => {
    setExpandedEventId((currentId) => (currentId === eventId ? null : eventId));
  };

  const getImportanceValue = (importance) => {
    const parsedValue = Number(importance);
    if (Number.isNaN(parsedValue)) {
      return 0;
    }
    return parsedValue;
  };

  const doNowEvents = events.filter((event) => getImportanceValue(event.importance) >= 8);
  const thinkAboutEvents = events.filter((event) => {
    const value = getImportanceValue(event.importance);
    return value >= 4 && value <= 7;
  });
  const canWaitEvents = events.filter((event) => getImportanceValue(event.importance) <= 3);

  const renderPriorityEvents = (priorityEvents, badgeClassName) => {
    if (priorityEvents.length === 0) {
      return <p className="empty-priority-text">No events yet.</p>;
    }

    return priorityEvents.map((event) => (
      <div
        className="event-pill-with-badge event-card"
        key={event.id}
        onClick={() => toggleEventExpanded(event.id)}
      >
        <div className="event-card-header">
          <span>{event.eventName}</span>
          <span className={`badge ${badgeClassName}`}>{event.importance}</span>
        </div>
        {expandedEventId === event.id ? (
          <div className="event-card-details">
            <p><strong>Type:</strong> {event.eventType}</p>
            <p><strong>Time:</strong> {event.eventTime}</p>
            <p><strong>Location:</strong> {event.eventLocation}</p>
          </div>
        ) : null}
      </div>
    ));
  };

  if (!user) {
    return (
      <div className="app-root">
        <div className="app auth-screen">
          <main className="screen auth-screen-main">
            <section className="auth-card auth-card-gated">
              <h1 className="auth-title">Busy Bee Calendar</h1>
              <p className="auth-subtitle">Sign in with Google to access your calendar.</p>
              <div className="auth-state auth-state-center">
                <div ref={googleButtonRef} />
                {googleError ? <p className="auth-error">{googleError}</p> : null}
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  if (showAddEvent) {
    return (
      <AddEvent
        onBack={() => setShowAddEvent(false)}
        onCreateEvent={handleCreateEvent}
      />
    );
  }

  return (
    <div className="app-root">
      <div className="app">
        <header className="header">
          <div className="header-title">Busy Bee Calendar</div>
          <div className="header-icons">
            <button
              type="button"
              className="icon-button"
              aria-label="Add event"
              onClick={() => setShowAddEvent(true)}
            >
              +
            </button>
            <button type="button" className="icon-button" aria-label="Download">
              &#8681;
            </button>
            <button type="button" className="icon-button" aria-label="Remove or minimize">
              -
            </button>
          </div>
          <div className="header-user-controls" ref={profileMenuRef}>
            <div className="header-bee">🐝</div>
            <button
              className="profile-button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-label="Open account menu"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={`${user.name} profile`}
                  className="profile-avatar"
                />
              ) : (
                <span className="profile-initial">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </button>
            {isProfileMenuOpen ? (
              <div className="profile-menu">
                <p className="profile-menu-name">{user.name}</p>
                {user.email ? <p className="profile-menu-email">{user.email}</p> : null}
                <button className="profile-menu-item" onClick={handleChangeAccount}>
                  Change account
                </button>
                <button className="profile-menu-item" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="screen">
          {/* top red section */}
          <section className="priority-banner priority-now">
            Do Now
          </section>
          <section className="priority-content">
            {renderPriorityEvents(doNowEvents, 'badge-now')}
          </section>

          {/* middle yellow section */}
          <section className="priority-banner priority-mid">
            Something To Think About
          </section>
          <section className="priority-content">
            {renderPriorityEvents(thinkAboutEvents, 'badge-mid')}
          </section>

          {/* bottom green section */}
          <section className="priority-banner priority-late">
            You Can Wait
          </section>
          <section className="priority-content">
            {renderPriorityEvents(canWaitEvents, 'badge-late')}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
