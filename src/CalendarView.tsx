import React, { useMemo, useState } from 'react';

type CalendarEvent = {
  id: string;
  iCalData: string;
  importance: number;
};

type ParsedEventDetails = {
  eventName: string;
  eventType: string;
  eventTime: string;
  eventLocation: string;
};

function unescapeIcsText(value = '') {
  return value.replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
}

function formatIcsDateTimeForDisplay(icsDateTime: string) {
  const trimmedValue = icsDateTime.trim();
  const match = trimmedValue.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (!match) {
    return '';
  }

  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function parseEventDetailsFromIcs(iCalData: string): ParsedEventDetails {
  const summaryMatch = iCalData.match(/^SUMMARY:(.*)$/m);
  const descriptionMatch = iCalData.match(/^DESCRIPTION:(.*)$/m);
  const categoriesMatch = iCalData.match(/^CATEGORIES:(.*)$/m);
  const locationMatch = iCalData.match(/^LOCATION:(.*)$/m);
  const dtStartMatch = iCalData.match(/^DTSTART(?::|;[^:]*:)(.*)$/m);
  const descriptionContent = descriptionMatch ? descriptionMatch[1] : '';
  const unescapedDescription = unescapeIcsText(descriptionContent);
  const descriptionTypeMatch = unescapedDescription.match(/(?:^|\n)TYPE:(.*)(?:\n|$)/);
  const descriptionTimeMatch = unescapedDescription.match(/(?:^|\n)TIME:(.*)(?:\n|$)/);
  const descriptionLocationMatch = unescapedDescription.match(/(?:^|\n)LOCATION:(.*)(?:\n|$)/);
  const timeFromDtStart = dtStartMatch ? formatIcsDateTimeForDisplay(dtStartMatch[1]) : '';

  return {
    eventName: unescapeIcsText(summaryMatch ? summaryMatch[1] : ''),
    eventType: unescapeIcsText(categoriesMatch ? categoriesMatch[1] : (descriptionTypeMatch ? descriptionTypeMatch[1] : '')),
    eventTime: timeFromDtStart || (descriptionTimeMatch ? descriptionTimeMatch[1] : ''),
    eventLocation: unescapeIcsText(locationMatch ? locationMatch[1] : (descriptionLocationMatch ? descriptionLocationMatch[1] : ''))
  };
}

function getEventDateKey(iCalData: string) {
  const dtStartMatch = iCalData.match(/^DTSTART(?::|;[^:]*:)(.*)$/m);
  if (!dtStartMatch) {
    return null;
  }

  const dtValue = dtStartMatch[1].trim();
  const match = dtValue.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

function pad2(value: number) {
  return value.toString().padStart(2, '0');
}

const MONTHS_2026 = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({
  events,
  onBack
}: {
  events: CalendarEvent[];
  onBack: () => void;
}) {
  const [monthIndex, setMonthIndex] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const dateKey = getEventDateKey(event.iCalData);
      if (!dateKey) {
        continue;
      }
      const list = map.get(dateKey) || [];
      list.push(event);
      map.set(dateKey, list);
    }
    return map;
  }, [events]);

  const year = 2026;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOffset = new Date(year, monthIndex, 1).getDay(); // 0=Sun

  const monthLabel = `${MONTHS_2026[monthIndex]} ${year}`;

  const selectedEvents = useMemo(() => {
    if (!selectedDateKey) {
      return [];
    }
    const list = eventMap.get(selectedDateKey) || [];
    return [...list].sort((a, b) => (a.importance < b.importance ? 1 : -1));
  }, [eventMap, selectedDateKey]);

  const leadingBlanks = Array.from({ length: firstDayOffset }, () => null);
  const dayCells = Array.from({ length: daysInMonth }, (_, idx) => idx + 1);
  const cells = [...leadingBlanks, ...dayCells];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <div className="app-root">
      <div className="app">
        <header className="header">
          <button type="button" className="header-title" onClick={onBack} aria-label="Go back">
            2026 Calendar
          </button>
        </header>

        <main className="screen">
          <section className="calendar-toolbar">
            <button
              type="button"
              className="calendar-nav-button"
              onClick={() => setMonthIndex((current) => (current === 0 ? 11 : current - 1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="calendar-month-label">{monthLabel}</div>
            <button
              type="button"
              className="calendar-nav-button"
              onClick={() => setMonthIndex((current) => (current === 11 ? 0 : current + 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </section>

          <section className="calendar-grid" aria-label={`${monthLabel} calendar grid`}>
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}

            {cells.map((dayNumber, idx) => {
              if (!dayNumber) {
                return <div key={`blank-${idx}`} className="calendar-day calendar-day-empty" />;
              }

              const dateKey = `${year}-${pad2(monthIndex + 1)}-${pad2(dayNumber)}`;
              const isSelected = selectedDateKey === dateKey;
              const dayEvents = eventMap.get(dateKey) || [];

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={`calendar-day ${isSelected ? 'calendar-day-selected' : ''}`}
                  onClick={() => setSelectedDateKey(dateKey)}
                  aria-label={`${dateKey} (${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'})`}
                >
                  <div className="calendar-day-number">{dayNumber}</div>
                  {dayEvents.length > 0 ? (
                    <div className="calendar-day-badge">{dayEvents.length}</div>
                  ) : null}
                </button>
              );
            })}
          </section>

          <section className="calendar-events-panel" aria-label="Selected day events">
            <div className="calendar-events-title">
              {selectedDateKey ? `Events on ${selectedDateKey}` : 'Click a day to see events'}
            </div>

            {selectedDateKey ? (
              selectedEvents.length > 0 ? (
                <div className="calendar-events-list">
                  {selectedEvents.map((event) => {
                    const parsed = parseEventDetailsFromIcs(event.iCalData);
                    return (
                      <div key={event.id} className="calendar-event-card">
                        <div className="calendar-event-card-header">
                          <span className="calendar-event-name">{parsed.eventName || 'Untitled event'}</span>
                          <span className="badge badge-mid">{event.importance}</span>
                        </div>
                        <div className="calendar-event-meta">
                          {parsed.eventTime ? <div><strong>Time:</strong> {parsed.eventTime}</div> : null}
                          {parsed.eventType ? <div><strong>Type:</strong> {parsed.eventType}</div> : null}
                          {parsed.eventLocation ? <div><strong>Location:</strong> {parsed.eventLocation}</div> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-priority-text">No events on this day.</p>
              )
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}

