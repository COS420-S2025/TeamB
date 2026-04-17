export type ImportedCalendarEvent = {
  iCalData: string;
  importance: number;
};

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

    if (!eventName) {
      return;
    }

    const eventLocation = (current.LOCATION || 'Imported').trim() || 'Imported';
    const eventType = (current.CATEGORIES || current.CATEGORY || 'Imported').trim() || 'Imported';
    const dtStart = current.DTSTART ? formatIcsDateTime(current.DTSTART) : '';
    const dtEnd = current.DTEND ? formatIcsDateTime(current.DTEND) : '';
    const eventTime =
      dtStart && dtEnd ? `${dtStart} - ${dtEnd}` : dtStart || dtEnd || (current.DTSTAMP || '').trim() || 'Imported';
    const priorityMatch = (current['X-BUSYBEE-IMPORTANCE'] || '').trim();
    const parsedPriority = Number.parseInt(priorityMatch, 10);
    const importance = Number.isNaN(parsedPriority) ? 5 : Math.min(9, Math.max(1, parsedPriority));
    const dtStamp = (current.DTSTAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')).trim();
    const uid = (current.UID || `${Date.now()}-${Math.random().toString(16).slice(2)}@busybee.import`).trim();

    const iCalData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Busy Bee Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      current.DTSTART ? `DTSTART:${current.DTSTART}` : '',
      current.DTEND ? `DTEND:${current.DTEND}` : '',
      `SUMMARY:${eventName}`,
      `LOCATION:${eventLocation}`,
      `CATEGORIES:${eventType}`,
      `DESCRIPTION:TYPE:${eventType}\\nTIME:${eventTime}\\nLOCATION:${eventLocation}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ]
      .filter(Boolean)
      .join('\r\n');

    results.push({
      iCalData,
      importance
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
