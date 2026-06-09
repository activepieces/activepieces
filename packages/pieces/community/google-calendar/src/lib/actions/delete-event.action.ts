import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleCalendarCommon, googleCalendarAuth, createGoogleClient } from '../common';

export const deleteEventAction = createAction({
  displayName: 'Delete Event',
  auth: googleCalendarAuth,
  name: 'delete_event',
  description: 'Deletes an event from Google Calendar.',
  audience: 'both',
  aiMetadata: { description: 'Permanently removes an event from a Google Calendar, identified by calendar and event ID. Use to cancel or delete an existing event. Requires the event ID and cannot be undone. Idempotent: once the event is deleted, repeating the call leaves it absent (a second call may report it as already gone).', idempotent: true },
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    eventId: Property.ShortText({
      displayName: 'Event ID',
      required: true,
    }),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const calendarId = context.propsValue.calendar_id;
    const eventId = context.propsValue.eventId;

    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const response = await calendar.events.delete({
      calendarId,
      eventId,
    });

    return response.data;
  },
});
