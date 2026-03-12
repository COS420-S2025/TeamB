import React from 'react';
import { Event } from '../types';
import { Header } from '../components/Header';

interface DeleteEventProps {
  events: Event[];
  onSelect: (event: Event) => void;
  onBack: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function DeleteEvent({ events, onSelect, onBack, onAdd, onRemove }: DeleteEventProps) {
  return (
    <div className="bee-screen">
      <Header showBack onBack={onBack} onAdd={onAdd} onRemove={onRemove} />
      <main className="bee-content">
        <h2 className="bee-screen-title">Select Event To Delete</h2>
        <div className="bee-event-list">
          {events.map((event) => (
            <button
              key={event.id}
              className="bee-event-card bee-event-delete"
              onClick={() => onSelect(event)}
            >
              {event.name}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
