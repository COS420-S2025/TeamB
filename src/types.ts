export interface Event {
  id: string;
  name: string;
  time?: string;
  location?: string;
  type: string;
  importance: number;
  date: string;
  startTime?: string;
  endTime?: string;
  reminders?: boolean;
}

export type View =
  | 'events'
  | 'eventForm'
  | 'eventDetails'
  | 'deleteEvent'
  | 'calendar'
  | 'invite'
  | 'settings'
  | 'home';
