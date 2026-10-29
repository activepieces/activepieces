function top({ limit }: { limit: number | undefined }): string {
  const value = limit ?? DEFAULT_LIMIT;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error('Limit must be a whole number of at least 1.');
  }
  return String(Math.min(value, MAX_LIMIT));
}

function preferTimeZone({ timeZone }: { timeZone: string | undefined }): Record<string, string> {
  return timeZone ? { Prefer: `outlook.timezone="${timeZone}"` } : {};
}

function eventOptions(): typeof EVENT_OPTIONS {
  return EVENT_OPTIONS;
}

function toAttendees({ items }: { items: unknown[] }) {
  return items.map((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('email' in item) ||
      typeof item.email !== 'string' ||
      item.email === ''
    ) {
      throw new Error('Each attendee needs an email.');
    }
    const name = 'name' in item && typeof item.name === 'string' ? item.name : '';
    const type = 'type' in item && typeof item.type === 'string' ? item.type : '';
    return {
      emailAddress: { address: item.email, ...(name ? { name } : {}) },
      type: type || 'required',
    };
  });
}

function calendarRoles(): string[] {
  return CALENDAR_ROLES;
}

function assertCalendarRole({ role }: { role: string }): void {
  if (!CALENDAR_ROLES.includes(role)) {
    throw new Error(`Role must be one of: ${CALENDAR_ROLES.join(', ')}.`);
  }
}

function proposedNewTime({
  start,
  end,
  timeZone,
}: {
  start: string | undefined;
  end: string | undefined;
  timeZone: string | undefined;
}): Record<string, unknown> {
  if ((start === undefined) !== (end === undefined)) {
    throw new Error('Proposed New Start and Proposed New End must be set together.');
  }
  if (start === undefined || end === undefined) {
    return {};
  }
  const zone = timeZone ?? 'UTC';
  return {
    proposedNewTime: {
      start: { dateTime: start, timeZone: zone },
      end: { dateTime: end, timeZone: zone },
    },
  };
}

export const outlookCalendarUtils = {
  top,
  preferTimeZone,
  assertCalendarRole,
  proposedNewTime,
  calendarRoles,
  eventOptions,
  toAttendees,
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 1000;

const CALENDAR_ROLES = [
  'none',
  'freeBusyRead',
  'limitedRead',
  'read',
  'write',
  'delegateWithoutPrivateEventAccess',
  'delegateWithPrivateEventAccess',
  'custom',
];

const EVENT_OPTIONS = {
  boolean: [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ],
  bodyType: [
    { label: 'Text', value: 'text' },
    { label: 'HTML', value: 'html' },
  ],
  attendeeType: [
    { label: 'Required', value: 'required' },
    { label: 'Optional', value: 'optional' },
    { label: 'Resource', value: 'resource' },
  ],
  showAs: [
    { label: 'Free', value: 'free' },
    { label: 'Tentative', value: 'tentative' },
    { label: 'Busy', value: 'busy' },
    { label: 'Out of Office', value: 'oof' },
    { label: 'Working Elsewhere', value: 'workingElsewhere' },
    { label: 'Unknown', value: 'unknown' },
  ],
  importance: [
    { label: 'Low', value: 'low' },
    { label: 'Normal', value: 'normal' },
    { label: 'High', value: 'high' },
  ],
  sensitivity: [
    { label: 'Normal', value: 'normal' },
    { label: 'Personal', value: 'personal' },
    { label: 'Private', value: 'private' },
    { label: 'Confidential', value: 'confidential' },
  ],
};
