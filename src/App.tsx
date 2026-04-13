import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import AddEvent from './addEvent.tsx';
import { type CalendarEvent, parseIcsToEvents } from './icsImport.ts';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

const SETTINGS_PANELS = {
  account: 'account',
  colorblind: 'colorblind'
};

const COLOR_PROFILES = {
  default: {
    label: 'Default colors',
    now: '#e74c3c',
    mid: '#f1a23c',
    late: '#3aa655'
  },
  deuteranopia: {
    label: 'Deuteranopia',
    now: '#d55e00',
    mid: '#f0e442',
    late: '#009e73'
  },
  protanopia: {
    label: 'Protanopia',
    now: '#c44e52',
    mid: '#e3c700',
    late: '#4caf50'
  },
  tritanopia: {
    label: 'Tritanopia',
    now: '#e15759',
    mid: '#edc948',
    late: '#59a14f'
  }
};

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
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    const utf8Payload = decodeURIComponent(
      decoded
        .split('')
        .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );
    return JSON.parse(utf8Payload);
  } catch (error) {
    return null;
  }
}

function getCurrentViewFromHash() {
  return window.location.hash === '#/settings' ? 'settings' : 'calendar';
}

function App() {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [googleError, setGoogleError] = useState('');
  const [user, setUser] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState(getCurrentViewFromHash);
  const [isAvatarBroken, setIsAvatarBroken] = useState(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState(SETTINGS_PANELS.account);
  const [colorProfile, setColorProfile] = useState('default');
  const googleButtonRef = useRef(null);
  const profileMenuRef = useRef(null);
  const icsInputRef = useRef<HTMLInputElement | null>(null);
  const selectedColorProfile = COLOR_PROFILES[colorProfile] || COLOR_PROFILES.default;
  const appColorVars = {
    '--priority-now-color': selectedColorProfile.now,
    '--priority-mid-color': selectedColorProfile.mid,
    '--priority-late-color': selectedColorProfile.late
  };

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
            picture: parsedUser.picture || parsedUser.imageUrl || ''
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
    const handleHashChange = () => {
      setCurrentView(getCurrentViewFromHash());
      setIsProfileMenuOpen(false);
      setActiveSettingsPanel(SETTINGS_PANELS.account);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    setIsAvatarBroken(false);
  }, [user?.picture]);

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

  const handleImportIcsClick = () => {
    icsInputRef.current?.click();
  };

  const handleImportIcsFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const imported = parseIcsToEvents(text);

      if (imported.length === 0) {
        window.alert('No events found in that .ics file.');
        return;
      }

      const base = Date.now();
      setEvents((previousEvents) => [
        ...previousEvents,
        ...imported.map((importedEvent, index) => ({
          ...importedEvent,
          id: `${base}-${index}`
        }))
      ]);

      window.alert(`Imported ${imported.length} event${imported.length === 1 ? '' : 's'}.`);
    } catch (error) {
      window.alert('Unable to import that .ics file.');
    }
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
  const thinkAboutEvents = events.filter((event) => getImportanceValue(event.importance) >= 4 && getImportanceValue(event.importance) <= 7);
  const canWaitEvents = events.filter((event) => getImportanceValue(event.importance) <= 3);
  const colorProfileOptions = Object.entries(COLOR_PROFILES);

  const handleColorProfileToggle = (profileKey) => {
    setColorProfile((currentProfile) => {
      if (profileKey === 'default') {
        return 'default';
      }
      return currentProfile === profileKey ? 'default' : profileKey;
    });
  };

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
      <div className="app-root" style={appColorVars}>
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

  if (currentView === 'settings') {
    return (
      <div className="app-root" style={appColorVars}>
        <div className="app">
          <header className="header">
            <div className="header-title">Settings</div>
            <div className="header-icons" />
            <div className="header-user-controls">
              <a
                href="#/"
                className="header-bee-link"
                aria-label="Go back to calendar"
                data-tooltip="Calendar"
              >
                🐝
              </a>
            </div>
          </header>
          <main className="screen">
            <section className="settings-layout">
              <aside className="settings-sidebar">
                <button
                  type="button"
                  className={`settings-keyword ${activeSettingsPanel === SETTINGS_PANELS.account ? 'settings-keyword-active' : ''}`}
                  onClick={() => setActiveSettingsPanel(SETTINGS_PANELS.account)}
                >
                  Account Settings
                </button>
                <button
                  type="button"
                  className={`settings-keyword ${activeSettingsPanel === SETTINGS_PANELS.colorblind ? 'settings-keyword-active' : ''}`}
                  onClick={() => setActiveSettingsPanel(SETTINGS_PANELS.colorblind)}
                >
                  Colorblind settings
                </button>
              </aside>
              <div className="settings-content">
                {activeSettingsPanel === SETTINGS_PANELS.account ? (
                  <section className="auth-card">
                    <h2 className="auth-title">Account Settings</h2>
                    <p className="auth-subtitle">Signed in as {user.name}</p>
                    {user.email ? <p className="auth-text">{user.email}</p> : null}
                  </section>
                ) : (
                  <section className="auth-card">
                    <h2 className="auth-title">Colorblind settings</h2>
                    <p className="auth-subtitle">
                      Toggle a color profile to update task priority colors.
                    </p>
                    <div className="settings-toggle-list">
                      {colorProfileOptions.map(([profileKey, profileValue]) => {
                        const isEnabled = colorProfile === profileKey;
                        return (
                          <button
                            key={profileKey}
                            type="button"
                            className={`settings-toggle ${isEnabled ? 'settings-toggle-enabled' : ''}`}
                            onClick={() => handleColorProfileToggle(profileKey)}
                            aria-pressed={isEnabled}
                          >
                            <span>{profileValue.label}</span>
                            <span className="settings-toggle-pill">{isEnabled ? 'On' : 'Off'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root" style={appColorVars}>
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
            <button type="button" className="icon-button" aria-label="Import .ics file" onClick={handleImportIcsClick}>
              &#8681;
            </button>
            <button type="button" className="icon-button" aria-label="Remove or minimize">
              -
            </button>
          </div>
          <input
            ref={icsInputRef}
            type="file"
            accept=".ics,text/calendar"
            style={{ display: 'none' }}
            onChange={handleImportIcsFile}
          />
          <div className="header-user-controls" ref={profileMenuRef}>
            <a
              href="#/settings"
              className="header-bee-link"
              aria-label="Open settings"
              data-tooltip="Settings"
            >
              🐝
            </a>
            <button
              className="profile-button"
              onClick={() => setIsProfileMenuOpen((open) => !open)}
              aria-label="Open account menu"
            >
              {user.picture && !isAvatarBroken ? (
                <img
                  src={user.picture}
                  alt={`${user.name} profile`}
                  className="profile-avatar"
                  referrerPolicy="no-referrer"
                  onError={() => setIsAvatarBroken(true)}
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
