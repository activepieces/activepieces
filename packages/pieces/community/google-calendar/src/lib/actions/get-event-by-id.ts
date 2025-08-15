import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCalendarCommon } from '../common';
import { googleCalendarAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const getEventById = createAction({
  auth: googleCalendarAuth,
  name: 'get_event_by_id',
  description: 'Get Event by ID',
  displayName: 'Get Event by ID',
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The unique identifier of the event to retrieve',
      required: true,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'Time zone used in the response (e.g., America/New_York). Optional. The default is the time zone of the calendar.',
      required: false,
    }),
    maxAttendees: Property.Number({
      displayName: 'Max Attendees',
      description: 'The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned.',
      required: false,
    }),
  },
  async run(configValue) {
    const {
      calendar_id: calendarId,
      event_id: eventId,
      timeZone,
      maxAttendees,
    } = configValue.propsValue;

    const authClient = new OAuth2Client();
    authClient.setCredentials(configValue.auth);

    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const queryParams: {
      timeZone?: string;
      maxAttendees?: number;
    } = {};
    
    if (timeZone) {
      queryParams.timeZone = timeZone;
    }
    
    if (maxAttendees !== undefined && maxAttendees !== null) {
      queryParams.maxAttendees = maxAttendees;
    }

    const response = await calendar.events.get({
      calendarId,
      eventId,
      ...queryParams,
    });

    return response.data;
  },
});
