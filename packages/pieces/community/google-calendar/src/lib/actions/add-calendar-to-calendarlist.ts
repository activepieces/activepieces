import { googleCalendarAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';

export const addCalendarToCalendarlist = createAction({
  auth: googleCalendarAuth,
  name: 'addCalendarToCalendarlist',
  displayName: 'Add calendar to calendarList',
  description: "Adds other people's calendars to your calendarList",
  props: {
    id: Property.ShortText({
      displayName: "Calendar Id",
      description: "Find calendar id by going to calendar settings",
      required: true
    })
  },
  async run(configValue) {
    // Action logic here
    const id = configValue.propsValue.id;

    const authClient = new OAuth2Client();
    authClient.setCredentials(configValue.auth);

    const calendar = google.calendar({ version: 'v3', auth: authClient});

    const response = await calendar.calendarList.insert({
      requestBody: {
        id: id
      }
    })

    return response.data;
  },
});
