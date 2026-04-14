import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddEvent from './addEvent';

describe('AddEvent', () => {
  it('renders the form and decorative header controls', () => {
    render(<AddEvent onBack={jest.fn()} onOpenSettings={jest.fn()} onImportIcsFile={jest.fn()} onCreateEvent={jest.fn()} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add event \(decorative\)/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to calendar' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Number Here')).toBeInTheDocument();
  });

  it('calls onBack when Back is clicked', async () => {
    const onBack = jest.fn();
    render(<AddEvent onBack={onBack} onOpenSettings={jest.fn()} onImportIcsFile={jest.fn()} onCreateEvent={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Back to calendar' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not call onCreateEvent when fields are incomplete', async () => {
    const onCreateEvent = jest.fn();
    render(<AddEvent onBack={jest.fn()} onOpenSettings={jest.fn()} onImportIcsFile={jest.fn()} onCreateEvent={onCreateEvent} />);

    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '9');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));
    expect(onCreateEvent).not.toHaveBeenCalled();
  });

  it('calls onCreateEvent and onBack when the form is valid', async () => {
    const onBack = jest.fn();
    const onCreateEvent = jest.fn();
    render(<AddEvent onBack={onBack} onOpenSettings={jest.fn()} onImportIcsFile={jest.fn()} onCreateEvent={onCreateEvent} />);

    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '8');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Lab');
    await userEvent.type(screen.getByPlaceholderText('Enter Name:'), 'Chem lab');
    await userEvent.type(screen.getByPlaceholderText('Time:'), '10am');
    await userEvent.type(screen.getByPlaceholderText('Enter Location:'), 'Room 2');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));

    expect(onCreateEvent).toHaveBeenCalledWith({
      importance: '8',
      eventType: 'Lab',
      eventName: 'Chem lab',
      eventTime: '10am',
      eventLocation: 'Room 2'
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('clears inputs when Clear is clicked', async () => {
    render(<AddEvent onBack={jest.fn()} onOpenSettings={jest.fn()} onImportIcsFile={jest.fn()} onCreateEvent={jest.fn()} />);

    const importance = screen.getByPlaceholderText('Enter Number Here');
    await userEvent.type(importance, '3');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Meetup');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(importance).toHaveValue('');
    expect(screen.getByPlaceholderText('Enter Type Here')).toHaveValue('');
  });
});
