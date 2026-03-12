import React from 'react';
import { Header } from '../components/Header';

interface HomeProps {
  onEnter: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export function Home({ onEnter, onAdd, onRemove }: HomeProps) {
  return (
    <div className="bee-screen">
      <Header onAdd={onAdd} onRemove={onRemove} />
      <main className="bee-content bee-home-content">
        <h1 className="bee-home-title">Busy Bee Calendar</h1>
        <p className="bee-home-subtitle">Your Schedule, Simplified</p>
        <button className="bee-btn bee-btn-primary" onClick={onEnter}>
          Open Calendar
        </button>
      </main>
    </div>
  );
}
