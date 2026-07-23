import { createAction } from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../common';
import { getEventByIdProps, runGetEventById } from './get-event-by-id';

export const aiGetEvent = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_get_event',
  displayName: 'Get Event',
  description: 'Fetch the full details of a single Google Calendar event by its event ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch the full details of one event by its unique event ID within a calendar. Use this when you already have an event ID (from a trigger or a list action) and need its current details; to find an event when you do not have its ID, use google_calendar_list_events or google_calendar_search_events_all_calendars instead. Resolve calendarId via google_calendar_list_calendars and eventId via google_calendar_list_events / google_calendar_search_events_all_calendars. Read-only and idempotent.',
    idempotent: true,
  },
  props: getEventByIdProps,
  run: runGetEventById,
});
