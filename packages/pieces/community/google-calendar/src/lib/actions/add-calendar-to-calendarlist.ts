import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleCalendarCommon, googleCalendarAuth, createGoogleClient } from '../common';

export const addCalendarToCalendarlist = createAction({
  auth: googleCalendarAuth,
  name: 'addCalendarToCalendarlist',
  displayName: 'Add Calendar to calendarList',
  description: "Adds other people's calendars to your calendarList",
  props: {
    id: Property.ShortText({
      displayName: "Calendar Id",
      description: "Find calendar id by going to calendar settings",
      required: true
    })
  },
  async run(context) {
    
    const id = context.propsValue.id;

    const authClient = await createGoogleClient(context.auth);

    const calendar = google.calendar({ version: 'v3', auth: authClient});

    const response = await calendar.calendarList.insert({
      requestBody: {
        id: id
      }
    })

    return response.data;
  },
});
