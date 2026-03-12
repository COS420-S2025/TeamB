import React, { useState } from 'react';
import { Event } from '../types';
import { Header } from '../components/Header';

interface EventDetailsProps {
  event: Event;
  onEdit: () => void;
  onSave: (updates: Partial<Event>) => void;
  onBack: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function EventDetails({ event, onEdit, onSave, onBack, onAdd, onRemove }: EventDetailsProps) {
  const [reminders, setReminders] = useState(event.reminders ?? false);
  const [eventType, setEventType] = useState(event.type);
  const [importance, setImportance] = useState(event.importance);
  const [name, setName] = useState(event.name);
  const [location, setLocation] = useState(event.location || '');

  const handleSave = () => {
    onSave({
      type: eventType,
      importance,
      name,
      location: location || undefined,
      reminders,
    });
  };

  return (
    <div className="bee-screen">
      <Header showBack onBack={onBack} onAdd={onAdd} onRemove={onRemove} />
      <main className="bee-content">
        <h2 className="bee-event-detail-title">{event.name} {event.time ? `@ ${event.time}` : ''}</h2>
        <button className="bee-btn bee-btn-edit" onClick={onEdit}>
          Edit
        </button>
        <div className="bee-reminder-toggle">
          <label>
            <input
              type="checkbox"
              checked={reminders}
              onChange={(e) => setReminders(e.target.checked)}
            />
            Add reminders
          </label>
        </div>
        <div className="bee-detail-fields">
          <label>Event Type</label>
          <input
            type="text"
            className="bee-input"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            placeholder="Enter Type Here"
          />
          <label>Importance (1–10)</label>
          <input
            type="number"
            className="bee-input"
            min={1}
            max={10}
            value={importance}
            onChange={(e) => setImportance(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
          <label>Event Name/Time/Location</label>
          <input
            type="text"
            className="bee-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Name"
          />
          <input
            type="text"
            className="bee-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter Location"
          />
        </div>
        <button className="bee-submit-btn" onClick={handleSave} aria-label="Save">
          ✓
        </button>
      </main>
    </div>
  );
}
