import React, { useState } from 'react';
import { Header } from '../components/Header';

interface InviteCalendarProps {
  onBack: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function InviteCalendar({ onBack, onAdd, onRemove }: InviteCalendarProps) {
  const [userToEvent, setUserToEvent] = useState('');
  const [userToApp, setUserToApp] = useState('');
  const [editImportance, setEditImportance] = useState<number>(5);
  const [eventName, setEventName] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBack();
  };

  return (
    <div className="bee-screen">
      <Header showBack onBack={onBack} onAdd={onAdd} onRemove={onRemove} />
      <main className="bee-content">
        <h2 className="bee-screen-title">Invite to Calendar</h2>
        <form className="bee-invite-form" onSubmit={handleSubmit}>
          <label>Add User to Event</label>
          <input
            type="text"
            className="bee-input"
            placeholder="Enter Type Here"
            value={userToEvent}
            onChange={(e) => setUserToEvent(e.target.value)}
          />
          <label>Add User to App</label>
          <input
            type="text"
            className="bee-input"
            placeholder="Enter Type Here"
            value={userToApp}
            onChange={(e) => setUserToApp(e.target.value)}
          />
          <label>Importance (1–10)</label>
          <input
            type="number"
            className="bee-input"
            min={1}
            max={10}
            value={editImportance}
            onChange={(e) => setEditImportance(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
          <label>Event Name</label>
          <input
            type="text"
            className="bee-input"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
          <label>Time</label>
          <input
            type="text"
            className="bee-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <label>Event Location</label>
          <input
            type="text"
            className="bee-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button type="submit" className="bee-submit-btn" aria-label="Save">
            ✓
          </button>
        </form>
      </main>
    </div>
  );
}
