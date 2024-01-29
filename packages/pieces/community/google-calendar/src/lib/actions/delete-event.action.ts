import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleCalendarAuth } from '../../index';
import { googleCalendarCommon } from '../common';

export const deleteEventAction = createAction({
  displayName: 'Delete Event',
  auth: googleCalendarAuth,
  name: 'delete_event',
  description: 'Deletes an event from Google Calendar.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    eventId: Property.ShortText({
      displayName: 'Event ID',
      required: true,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

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
