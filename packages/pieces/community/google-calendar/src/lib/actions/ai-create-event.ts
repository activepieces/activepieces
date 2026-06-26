import { createAction } from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../common';
import { createEventProps, runCreateEvent } from './create-event';

export const aiCreateEvent = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_create_event',
  displayName: 'Create Event',
  description:
    'Create a new event on a Google Calendar with structured fields (title, start/end, location, description, attendees, color) and an optional Google Meet link.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new event on a calendar from explicit structured fields (title, start/end times, location, description, attendees, color, guest permissions) with an optional Google Meet link. Use this when you already have the event details; for a single natural-language phrase use the quick-add path instead. Resolve calendarId via google_calendar_list_calendars (default "primary"). Requires a title and start time; end defaults to 30 minutes after start. Not idempotent: each call creates a new event.',
    idempotent: false,
  },
  props: createEventProps,
  run: runCreateEvent,
});
