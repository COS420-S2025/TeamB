import React from 'react';
import { Event } from '../types';
import { Header } from '../components/Header';

interface EventsListProps {
  events: Event[];
  onNewEvent: () => void;
  onEventClick: (event: Event) => void;
  onDeleteEvent: () => void;
  onCalendar: () => void;
  onInvite: () => void;
  onSettings: () => void;
}

export function EventsList({
  events,
  onNewEvent,
  onEventClick,
  onDeleteEvent,
  onCalendar,
  onInvite,
  onSettings,
}: EventsListProps) {
  const getEventClass = (importance: number) => {
    return importance >= 7 ? 'bee-event-high' : 'bee-event-normal';
  };

  return (
    <div className="bee-screen">
      <Header
        showCalendar
        onCalendar={onCalendar}
        onAdd={onNewEvent}
        onRemove={onDeleteEvent}
      />
      <main className="bee-content">
        <div className="bee-event-list">
          {events.map((event) => (
            <button
              key={event.id}
              className={`bee-event-card ${getEventClass(event.importance)}`}
              onClick={() => onEventClick(event)}
            >
              {event.name}
            </button>
          ))}
        </div>
        <div className="bee-footer-actions">
          <button className="bee-link" onClick={onInvite}>
            Invite to Calendar
          </button>
          <button className="bee-link" onClick={onSettings}>
            Settings
          </button>
        </div>
      </main>
    </div>
  );
}
