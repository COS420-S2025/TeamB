import React, { useState } from 'react';
import { Event } from '../types';
import { Header } from '../components/Header';

interface EventFormProps {
  event?: Event | null;
  onSave: (event: Partial<Event>) => void;
  onBack: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function EventForm({ event, onSave, onBack, onAdd, onRemove }: EventFormProps) {
  const [importance, setImportance] = useState<number>(event?.importance ?? 5);
  const [eventType, setEventType] = useState(event?.type || '');
  const [date, setDate] = useState(event?.date || '');
  const [nameTimeLocation, setNameTimeLocation] = useState(
    event ? [event.name, event.time, event.location].filter(Boolean).join(' / ') : ''
  );
  const [startTime, setStartTime] = useState(event?.startTime || '');
  const [endTime, setEndTime] = useState(event?.endTime || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [name, time, location] = nameTimeLocation.split('/').map((s) => s.trim());
    onSave({
      importance,
      type: eventType,
      date,
      name: name || event?.name,
      time: time || event?.time,
      location: location || event?.location,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });
  };

  return (
    <div className="bee-screen">
      <Header showBack onBack={onBack} onAdd={onAdd} onRemove={onRemove} />
      <main className="bee-content">
        <div className="bee-form-icon">+</div>
        <form className="bee-form" onSubmit={handleSubmit}>
          <label>Importance (1–10)</label>
          <input
            type="number"
            className="bee-input"
            min={1}
            max={10}
            value={importance}
            onChange={(e) => setImportance(Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            required
          />
          <input
            type="text"
            className="bee-input"
            placeholder="Event Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            required
          />
          <input
            type="text"
            className="bee-input"
            placeholder="Date Type Here"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            type="text"
            className="bee-input bee-input-wide"
            placeholder="Event Name / Time / Location"
            value={nameTimeLocation}
            onChange={(e) => setNameTimeLocation(e.target.value)}
            required
          />
          <input
            type="text"
            className="bee-input"
            placeholder="Start Time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <input
            type="text"
            className="bee-input"
            placeholder="End Time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          <button type="submit" className="bee-submit-btn" aria-label="Save">
            ✓
          </button>
        </form>
      </main>
    </div>
  );
}
