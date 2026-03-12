import React, { useState } from 'react';
import './App.css';
import AddEvent from './addEvent.tsx';

function App() {
  const [showAddEvent, setShowAddEvent] = useState(false);

  if (showAddEvent) {
    return <AddEvent onBack={() => setShowAddEvent(false)} />;
  }

  return (
    <div className="app-root">
      <div className="app">
        <header className="header">
          <div className="header-title">Busy Bee Calendar</div>
          <div className="header-icons">
            <button
              className="icon-button"
              onClick={() => setShowAddEvent(true)}
            >
              +
            </button>
            <button className="icon-button">&#8681;</button>
            <button className="icon-button">-</button>
          </div>
          <div className="header-bee">🐝</div>
        </header>

        <main className="screen">
          {/* top red section */}
          <section className="priority-banner priority-now">
            Do Now
          </section>

          {/* middle yellow section */}
          <section className="priority-banner priority-mid">
            Something To Think About
          </section>

          {/* bottom green section */}
          <section className="priority-banner priority-late">
            You Can Wait
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
