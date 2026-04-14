import React, { useRef, useState } from 'react';

type AddEventProps = {
  onBack: () => void;
  onOpenSettings: () => void;
  onImportIcsFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateEvent: (event: {
    importance: string;
    eventType: string;
    eventName: string;
    eventTime: string;
    eventLocation: string;
  }) => void;
};

const AddEvent: React.FC<AddEventProps> = ({ onBack, onOpenSettings, onImportIcsFile, onCreateEvent }) => {
  const [importance, setImportance] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const icsInputRef = useRef<HTMLInputElement | null>(null);

  const handleClear = () => {
    setImportance('');
    setEventType('');
    setEventName('');
    setEventTime('');
    setEventLocation('');
  };

  const handleCreateEvent = () => {
    const trimmedImportance = importance.trim();
    const trimmedEventType = eventType.trim();
    const trimmedEventName = eventName.trim();
    const trimmedEventTime = eventTime.trim();
    const trimmedEventLocation = eventLocation.trim();

    if (
      !trimmedImportance ||
      !trimmedEventType ||
      !trimmedEventName ||
      !trimmedEventTime ||
      !trimmedEventLocation
    ) {
      return;
    }

    onCreateEvent({
      importance: trimmedImportance,
      eventType: trimmedEventType,
      eventName: trimmedEventName,
      eventTime: trimmedEventTime,
      eventLocation: trimmedEventLocation
    });
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
            <div className="field-label-pill">Event Name/Time/Location:</div>
            <input
              className="field-input-pill"
              placeholder="Enter Name:"
              value={eventName}
              onChange={(event) => setEventName(event.target.value)}
            />
            <input
              className="field-input-pill"
              placeholder="Time:"
              value={eventTime}
              onChange={(event) => setEventTime(event.target.value)}
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
