import React from 'react';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AddEvent from './addEvent';

describe('AddEvent', () => {
  function renderAddEvent(overrides = {}) {
    const props = {
      onBack: jest.fn(),
      onOpenSettings: jest.fn(),
      onImportIcsFile: jest.fn(),
      onCreateEvent: jest.fn(),
      onDownloadEvents: jest.fn(),
      canDownloadEvents: false,
      ...overrides
    };

    render(<AddEvent {...props} />);
    return props;
  }

  it('renders the form and decorative header controls', () => {
    renderAddEvent();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add event \(decorative\)/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to calendar' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Number Here')).toBeInTheDocument();
  });

  it('calls onBack when Back is clicked', async () => {
    const onBack = jest.fn();
    renderAddEvent({ onBack });

    await userEvent.click(screen.getByRole('button', { name: 'Back to calendar' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not call onCreateEvent when fields are incomplete', async () => {
    const onCreateEvent = jest.fn();
    renderAddEvent({ onCreateEvent });

    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '9');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));
    expect(onCreateEvent).not.toHaveBeenCalled();
  });

  it('calls onCreateEvent and onBack when the form is valid', async () => {
    const onBack = jest.fn();
    const onCreateEvent = jest.fn();
    renderAddEvent({ onBack, onCreateEvent });

    await userEvent.type(screen.getByPlaceholderText('Enter Number Here'), '8');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Lab');
    await userEvent.type(screen.getByPlaceholderText('Enter Name:'), 'Chem lab');
    fireEvent.change(screen.getByLabelText('Event date and time'), {
      target: { value: '2026-04-16T10:00' }
    });
    await userEvent.type(screen.getByPlaceholderText('Enter Location:'), 'Room 2');
    await userEvent.click(screen.getByRole('button', { name: 'Create event' }));

    expect(onCreateEvent).toHaveBeenCalledTimes(1);
    const [createdEventTuple] = onCreateEvent.mock.calls[0];
    expect(createdEventTuple).toEqual([
      expect.stringContaining('BEGIN:VCALENDAR'),
      8
    ]);
    expect(createdEventTuple[0]).toContain('SUMMARY:Chem lab');
    expect(createdEventTuple[0]).toContain('DTSTART:20260416T100000');
    expect(createdEventTuple[0]).toContain('LOCATION:Room 2');
    expect(createdEventTuple[0]).toContain('CATEGORIES:Lab');
    expect(createdEventTuple[0]).toContain('DESCRIPTION:TYPE:Lab');
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('clears inputs when Clear is clicked', async () => {
    renderAddEvent();

    const importance = screen.getByPlaceholderText('Enter Number Here');
    await userEvent.type(importance, '3');
    await userEvent.type(screen.getByPlaceholderText('Enter Type Here'), 'Meetup');
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(importance).toHaveValue('');
    expect(screen.getByPlaceholderText('Enter Type Here')).toHaveValue('');
  });

  it('uses the header download button', async () => {
    const { onDownloadEvents } = renderAddEvent({
      onDownloadEvents: jest.fn(),
      canDownloadEvents: true
    });

    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(onDownloadEvents).toHaveBeenCalledTimes(1);
  });
});
