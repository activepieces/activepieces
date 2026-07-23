import { createAction } from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../common';
import { getEventsProps, runGetEvents } from './get-events';

export const aiListEvents = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_list_events',
  displayName: 'List Events',
  description:
    'List events from one Google Calendar, optionally filtered by date range, free-text search, and event types.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List events from one calendar, optionally narrowed by a date range, a free-text search term (matched with Google\'s native q= filter), and event types, optionally expanding recurring events into individual instances. Use this to browse or find events in a known calendar, including text search within that calendar; to search across every calendar when you do not know which one holds the event, use google_calendar_search_events_all_calendars instead. Resolve calendarId via google_calendar_list_calendars (default "primary"). Read-only and idempotent.',
    idempotent: true,
  },
  props: getEventsProps,
  run: runGetEvents,
});
