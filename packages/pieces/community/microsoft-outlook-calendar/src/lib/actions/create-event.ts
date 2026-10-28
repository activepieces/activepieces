import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { outlookCalendarAuth } from '../auth';
import { outlookCalendarClient } from '../common/client';
import { outlookCalendarProps } from '../common/props';
import dayjs from 'dayjs';

export const createEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'create_event',
  classification: 'WRITE',
  description: 'Create a new event in a calendar',
  audience: 'both',
  aiMetadata: { description: 'Creates a new calendar event in a specified Microsoft Outlook calendar with a title, start time, and optional end time (defaults to 30 minutes after start), timezone, and location. Use to schedule a meeting or appointment. Not idempotent: each call adds a new event, so repeated calls create duplicates.', idempotent: false },
  displayName: 'Create a new event in a calendar',
  props: {
    calendarId: outlookCalendarProps.calendarId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title of the event',
      required: true,
    }),
    start: Property.DateTime({
      displayName: 'Start date time of the event',
      required: true,
    }),
    end: Property.DateTime({
      displayName: 'End date time of the event',
      description: "By default it'll be 30 min post start time",
      required: false,
    }),
    timezone: outlookCalendarProps.timezone({ required: true }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const startDateTime = dayjs(propsValue.start).format('YYYY-MM-DDTHH:mm:ss');
    const endTime = propsValue.end
      ? propsValue.end
      : dayjs(startDateTime).add(30, 'm');
    const endDateTime = dayjs(endTime).format('YYYY-MM-DDTHH:mm:ss');

    return await outlookCalendarClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/calendars/${propsValue.calendarId}/events`,
      body: {
        subject: propsValue.title,
        body: {},
        start: {
          dateTime: startDateTime,
          timeZone: propsValue.timezone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: propsValue.timezone,
        },
        location: {
          displayName: propsValue.location,
        },
      },
    });
  },
});
