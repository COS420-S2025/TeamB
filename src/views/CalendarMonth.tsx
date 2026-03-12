import React, { useState } from 'react';
import { Header } from '../components/Header';

interface CalendarMonthProps {
  onBack: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarMonth({ onBack, onAdd, onRemove }: CalendarMonthProps) {
  const [currentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array(firstDay).fill(null);

  const allCells = [...emptyCells, ...days];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < allCells.length; i += 7) {
    weeks.push(allCells.slice(i, i + 7));
  }
  while (weeks[weeks.length - 1]?.length < 7) {
    weeks[weeks.length - 1].push(null);
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div className="bee-screen">
      <Header showBack onBack={onBack} showCalendar onCalendar={onBack} onAdd={onAdd} onRemove={onRemove} />
      <main className="bee-content">
        <h2 className="bee-calendar-title">{monthName} {year}</h2>
        <div className="bee-calendar">
          <div className="bee-calendar-header">
            {DAYS.map((day) => (
              <div key={day} className="bee-calendar-day-name">
                {day}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="bee-calendar-row">
              {week.map((day, di) => (
                <div key={di} className="bee-calendar-cell">
                  {day ?? ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
