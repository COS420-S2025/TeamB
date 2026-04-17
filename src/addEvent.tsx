import React, { useRef, useState } from 'react';

type AddEventProps = {
  onBack: () => void;
  onOpenSettings: () => void;
  onImportIcsFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateEvent: (event: [string, number]) => void;
  onDownloadEvents: () => void;
  canDownloadEvents: boolean;
};

const AddEvent: React.FC<AddEventProps> = ({
  onBack,
  onOpenSettings,
  onImportIcsFile,
  onCreateEvent,
  onDownloadEvents,
  canDownloadEvents
}) => {
  const [importance, setImportance] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const icsInputRef = useRef<HTMLInputElement | null>(null);

  const escapeIcsText = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');

  const toIcsLocalDateTime = (dateValue: string | Date) => {
    const parsedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return '';
    }

    const pad = (value: number) => `${value}`.padStart(2, '0');
    return `${parsedDate.getFullYear()}${pad(parsedDate.getMonth() + 1)}${pad(parsedDate.getDate())}T${pad(parsedDate.getHours())}${pad(parsedDate.getMinutes())}00`;
  };

  const handleClear = () => {
    setImportance('');
    setEventType('');
    setEventName('');
    setEventDateTime('');
    setEventLocation('');
  };

  const handleCreateEvent = () => {
    const trimmedImportance = importance.trim();
    const trimmedEventType = eventType.trim();
    const trimmedEventName = eventName.trim();
    const trimmedEventDateTime = eventDateTime.trim();
    const trimmedEventLocation = eventLocation.trim();

    if (
      !trimmedImportance ||
      !trimmedEventType ||
      !trimmedEventName ||
      !trimmedEventDateTime ||
      !trimmedEventLocation
    ) {
      return;
    }

    const parsedImportance = Number.parseInt(trimmedImportance, 10);
    if (Number.isNaN(parsedImportance)) {
      return;
    }

    const startDate = new Date(trimmedEventDateTime);
    if (Number.isNaN(startDate.getTime())) {
      return;
    }
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const escapedEventType = escapeIcsText(trimmedEventType);
    const escapedEventName = escapeIcsText(trimmedEventName);
    const escapedEventLocation = escapeIcsText(trimmedEventLocation);
    const escapedDisplayTime = escapeIcsText(startDate.toLocaleString());
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const iCalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Busy Bee Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@busybee.local`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${toIcsLocalDateTime(trimmedEventDateTime)}`,
      `DTEND:${toIcsLocalDateTime(endDate)}`,
      `SUMMARY:${escapedEventName}`,
      `LOCATION:${escapedEventLocation}`,
      `CATEGORIES:${escapedEventType}`,
      `DESCRIPTION:TYPE:${escapedEventType}\\nTIME:${escapedDisplayTime}\\nLOCATION:${escapedEventLocation}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    onCreateEvent([iCalData, parsedImportance]);
    handleClear();
    onBack();
  };

  const handleImportIcsClick = () => {
    icsInputRef.current?.click();
  };

  return (
    <div className="app">
      <header className="header">
        <button
          type="button"
          className="header-title"
          aria-label="Go to homepage"
          onClick={onBack}
        >
          Busy Bee Calendar
        </button>
        <div className="header-icons">
          <button type="button" className="icon-button" aria-label="Add event (decorative)">
            +
          </button>
          <button type="button" className="icon-button" aria-label="Import .ics file" onClick={handleImportIcsClick}>
            &#8681;
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Download"
            onClick={onDownloadEvents}
            disabled={!canDownloadEvents}
          >
            &#8681;
          </button>
          <button type="button" className="icon-button" aria-label="Remove (decorative)">
            -
          </button>
        </div>
        <input
          ref={icsInputRef}
          type="file"
          accept=".ics,text/calendar"
          style={{ display: 'none' }}
          onChange={onImportIcsFile}
        />
        <button
          type="button"
          className="header-bee-link"
          aria-label="Open settings"
          data-tooltip="Settings"
          onClick={onOpenSettings}
        >
          🐝
        </button>
      </header>

      <main className="screen">
        <button type="button" className="back-button" aria-label="Back to calendar" onClick={onBack}>
          &#8630;
        </button>

        <section className="panel">
          <div className="panel-title">+</div>

          <div className="field-group">
            <div className="field-label-pill">Select importance:</div>
            <input
              className="field-input-pill"
              placeholder="Enter Number Here"
              value={importance}
              onChange={(event) => setImportance(event.target.value)}
            />
          </div>

          <div className="field-group">
            <div className="field-label-pill">Event Type:</div>
            <input
              className="field-input-pill"
              placeholder="Enter Type Here"
              value={eventType}
              onChange={(event) => setEventType(event.target.value)}
            />
          </div>

          <div className="field-group">
            <div className="field-label-pill">Event Name/Date Time/Location:</div>
            <input
              className="field-input-pill"
              placeholder="Enter Name:"
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
            />
            <input
              className="field-input-pill"
              type="datetime-local"
              aria-label="Event date and time"
              value={eventDateTime}
              onChange={(event) => setEventDateTime(event.target.value)}
            />
            <input
              className="field-input-pill"
              placeholder="Enter Location:"
              value={eventLocation}
              onChange={(event) => setEventLocation(event.target.value)}
            />
          </div>

          <div className="event-action-row">
            <button type="button" className="clear-button" onClick={handleClear}>
              Clear
            </button>
            <button type="button" className="check-button" aria-label="Create event" onClick={handleCreateEvent}>
              ✓
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AddEvent;
