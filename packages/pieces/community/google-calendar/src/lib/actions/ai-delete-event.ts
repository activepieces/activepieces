import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCalendarCommon, googleCalendarAuth } from '../common';
import { runDeleteEvent } from './delete-event.action';

const props = {
  calendar_id: googleCalendarCommon.calendarDropdown('writer'),
  event_id: Property.ShortText({
    displayName: 'Event ID',
    description:
      'The ID of the event to delete. Resolve it via List Events or Search Events Across Calendars.',
    required: true,
  }),
};

export const aiDeleteEvent = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_delete_event',
  displayName: 'Delete Event',
  description: 'Permanently delete an event from a Google Calendar by its event ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete an event from a calendar, identified by calendar and event ID. Use to cancel or remove an existing event; this cannot be undone, so confirm the event ID first. Resolve calendarId via google_calendar_list_calendars and eventId via google_calendar_list_events / google_calendar_search_events_all_calendars. Idempotent: once deleted, re-running leaves the event absent (a repeat call may report it as already gone).',
    idempotent: true,
  },
  props,
  run: (context) =>
    runDeleteEvent({
      ...context,
      propsValue: {
        calendar_id: context.propsValue.calendar_id,
        eventId: context.propsValue.event_id,
      },
    }),
});
