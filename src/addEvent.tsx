import React from 'react';

type AddEventProps = {
  onBack: () => void;
};

const AddEvent: React.FC<AddEventProps> = ({ onBack }) => {
  return (
    <div className="app">
      <header className="header">
        <div className="header-title">Busy Bee Calendar</div>
        <div className="header-icons">
          <button className="icon-button">+</button>
          <button className="icon-button">&#8681;</button>
          <button className="icon-button">-</button>
        </div>
        <div className="header-bee">🐝</div>
      </header>

      <main className="screen">
        <button className="back-button" onClick={onBack}>
          &#8630;
        </button>

        <section className="panel">
          <div className="panel-title">+</div>

          <div className="field-group">
            <div className="field-label-pill">Select importance:</div>
            <input
              className="field-input-pill"
              placeholder="Enter Number Here"
            />
          </div>

          <div className="field-group">
            <div className="field-label-pill">Event Type:</div>
            <input
              className="field-input-pill"
              placeholder="Enter Type Here"
            />
          </div>

          <div className="field-group">
            <div className="field-label-pill">Event Name/Time/Location:</div>
            <div className="field-row">
              <input
                className="field-input-small"
                placeholder="Enter Name:"
              />
              <input className="field-input-small" placeholder="Time:" />
            </div>
            <input
              className="field-input-pill"
              placeholder="Enter Location:"
            />
          </div>

          <button className="check-button">✓</button>
        </section>
      </main>
    </div>
  );
};

export default AddEvent;
