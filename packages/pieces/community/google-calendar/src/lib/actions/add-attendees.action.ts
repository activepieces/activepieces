import { googleCalendarAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { googleCalendarCommon } from '../common';

export const addAttendeesToEventAction = createAction({
  auth: googleCalendarAuth,
  name: 'google-calendar-add-attendees',
  displayName: 'Add Attendees to Event',
  description: 'Add one or more person to existing event.',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown('writer'),
    eventId: Property.ShortText({
      displayName: 'Event ID',
      required: true,
    }),
    attendees: Property.Array({
      displayName: 'Attendees',
      description: 'Emails of the attendees (guests)',
      required: true,
    }),
  },
  async run(context) {
    const { calendar_id, eventId } = context.propsValue;
    const attendeesInput = context.propsValue.attendees as string[];

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const calendar = google.calendar({ version: 'v3', auth: authClient });

    // Note that each patch request consumes three quota units;
    // prefer using a get followed by an update
    const currentEvent = await calendar.events.get({
      calendarId: calendar_id,
      eventId: eventId,
    });
    const currentAttendees = currentEvent.data.attendees ?? [];

    const attendeeFormattedList: calendar_v3.Schema$EventAttendee[] = [];
    attendeeFormattedList.push(...currentAttendees);
    attendeeFormattedList.push(...attendeesInput.map((email) => ({ email })));

    const response = await calendar.events.update({
      calendarId: calendar_id!,
      eventId,
      requestBody: {
        ...currentEvent.data,
        attendees: attendeeFormattedList,
      },
    });

    return response.data;
  },
});
