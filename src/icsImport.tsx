export type CalendarEvent = {
  id: string;
  importance: string;
  eventType: string;
  eventName: string;
  eventTime: string;
  eventLocation: string;
};

export type ImportedCalendarEvent = Omit<CalendarEvent, 'id'>;

function unfoldIcsLines(rawText: string) {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const unfolded: string[] = [];

  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
      continue;
    }
    unfolded.push(line);
  }

  return unfolded;
}

function formatIcsDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  // YYYYMMDD (all-day)
  if (/^\d{8}$/.test(trimmed)) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6));
    const day = Number(trimmed.slice(6, 8));
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
      return trimmed;
    }
    return date.toLocaleDateString();
  }

  // YYYYMMDDTHHMMSSZ? (UTC or floating)
  const match = trimmed.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!match) {
    return trimmed;
  }

  const [, y, m, d, hh, mm, ss, zulu] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const hour = Number(hh);
  const minute = Number(mm);
  const second = Number(ss);

  const date = zulu
    ? new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    : new Date(year, month - 1, day, hour, minute, second);

  if (Number.isNaN(date.getTime())) {
    return trimmed;
  }

  return date.toLocaleString();
}

export function parseIcsToEvents(rawText: string): ImportedCalendarEvent[] {
  const lines = unfoldIcsLines(rawText);
  const results: ImportedCalendarEvent[] = [];

  let inEvent = false;
  let current: Record<string, string> = {};

  const flush = () => {
    const eventName = (current.SUMMARY || '').trim();
    const eventLocation = (current.LOCATION || '').trim();
    const eventType = (current.CATEGORIES || current.CATEGORY || 'Imported').trim() || 'Imported';
    const dtStart = current.DTSTART ? formatIcsDateTime(current.DTSTART) : '';
    const dtEnd = current.DTEND ? formatIcsDateTime(current.DTEND) : '';

    if (!eventName) {
      return;
    }

    const eventTime =
      dtStart && dtEnd ? `${dtStart} - ${dtEnd}` : dtStart || dtEnd || (current.DTSTAMP || '').trim();

    results.push({
      importance: '5',
      eventType,
      eventName,
      eventTime: eventTime || 'Imported',
      eventLocation: eventLocation || 'Imported'
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line) {
      continue;
    }

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (inEvent) {
        flush();
      }
      inEvent = false;
      current = {};
      continue;
    }

    if (!inEvent) {
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const keyPart = line.slice(0, separatorIndex);
    const valuePart = line.slice(separatorIndex + 1);
    const key = keyPart.split(';')[0]?.trim().toUpperCase();
    if (!key) {
      continue;
    }

    // Keep the first value we see for a key.
    if (current[key] == null) {
      current[key] = valuePart;
    }
  }

  return results;
}
