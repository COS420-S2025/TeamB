import React, { useState, useCallback } from 'react';
import { Event, View } from './types';
import { initialEvents } from './data';
import {
  Home,
  EventsList,
  DeleteEvent,
  EventForm,
  EventDetails,
  CalendarMonth,
  InviteCalendar,
  Settings,
} from './views';
import './App.css';

function App() {
  const [view, setView] = useState<View>('home');
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const goTo = useCallback((v: View) => {
    setView(v);
    if (v !== 'eventDetails' && v !== 'eventForm') {
      setSelectedEvent(null);
      setEditingEvent(null);
    }
  }, []);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    goTo('eventDetails');
  };

  const handleSaveEvent = (updates: Partial<Event>) => {
    if (editingEvent) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id ? { ...e, ...updates } : e
        )
      );
      setSelectedEvent((prev) =>
        prev?.id === editingEvent.id ? { ...prev, ...updates } : prev
      );
    } else {
      const newEvent: Event = {
        id: String(Date.now()),
        name: updates.name || 'New Event',
        type: updates.type || 'general',
        importance: updates.importance ?? 5,
        date: updates.date || new Date().toISOString().slice(0, 10),
        ...updates,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    goTo('events');
  };

  const handleDeleteEvent = (event: Event) => {
    setEvents((prev) => prev.filter((e) => e.id !== event.id));
    goTo('events');
  };

  const handleEditFromDetails = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
      goTo('eventForm');
    }
  };

  const handleSaveDetails = (updates: Partial<Event>) => {
    if (selectedEvent) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selectedEvent.id ? { ...e, ...updates } : e
        )
      );
      setSelectedEvent((prev) =>
        prev ? { ...prev, ...updates } : null
      );
      goTo('events');
    }
  };

  const renderSettingsAction = () => {
    alert('This would open the respective screen.');
  };

  const handleAdd = () => {
    setEditingEvent(null);
    goTo('eventForm');
  };

  const handleRemove = () => goTo('deleteEvent');

  return (
    <div className="bee-app">
      {view === 'home' && (
        <Home onEnter={() => goTo('events')} onAdd={handleAdd} onRemove={handleRemove} />
      )}
      {view === 'events' && (
        <EventsList
          events={events}
          onNewEvent={handleAdd}
          onEventClick={handleEventClick}
          onDeleteEvent={handleRemove}
          onCalendar={() => goTo('calendar')}
          onInvite={() => goTo('invite')}
          onSettings={() => goTo('settings')}
        />
      )}
      {view === 'deleteEvent' && (
        <DeleteEvent
          events={events}
          onSelect={handleDeleteEvent}
          onBack={() => goTo('events')}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      )}
      {view === 'eventForm' && (
        <EventForm
          event={editingEvent}
          onSave={handleSaveEvent}
          onBack={() => goTo(editingEvent ? 'eventDetails' : 'events')}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      )}
      {view === 'eventDetails' && selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onEdit={handleEditFromDetails}
          onSave={handleSaveDetails}
          onBack={() => goTo('events')}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      )}
      {view === 'calendar' && (
        <CalendarMonth onBack={() => goTo('events')} onAdd={handleAdd} onRemove={handleRemove} />
      )}
      {view === 'invite' && (
        <InviteCalendar onBack={() => goTo('events')} onAdd={handleAdd} onRemove={handleRemove} />
      )}
      {view === 'settings' && (
        <Settings
          onBack={() => goTo('events')}
          onContactList={renderSettingsAction}
          onReportIssue={renderSettingsAction}
          onSuggestChange={renderSettingsAction}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
}

export default App;
