import React from 'react';

interface HeaderProps {
  onBack?: () => void;
  onCalendar?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  showBack?: boolean;
  showCalendar?: boolean;
}

export function Header({ onBack, onCalendar, onAdd, onRemove, showBack, showCalendar }: HeaderProps) {
  return (
    <header className="bee-header">
      <div className="bee-header-inner">
        {showBack && (
          <button className="bee-header-back" onClick={onBack} aria-label="Go back">
            ↩
          </button>
        )}
        <span className="bee-header-logo">Busy Bee Calendar</span>
        <div className="bee-header-actions">
          <button className="bee-header-btn" onClick={onAdd} aria-label="Add event">+</button>
          <button className="bee-header-btn" onClick={onRemove} aria-label="Delete event">−</button>
          {showCalendar && (
            <button className="bee-header-btn bee-header-calendar" onClick={onCalendar} aria-label="Calendar">
              📅
            </button>
          )}
          <span className="bee-icon" role="img" aria-label="Bee">🐝</span>
        </div>
      </div>
    </header>
  );
}
