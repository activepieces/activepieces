import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarClient } from '../../../common/client';

import type { OutlookCalendarPage, ScheduleInformation } from '../../../common/types';
import { outlookCalendarScheduleOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetScheduleAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_schedule',
  outputSchema: outlookCalendarScheduleOutputSchema,
  displayName: 'Get Schedule',
  description: 'Gets the free/busy availability of people, rooms or resources.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the free/busy schedule of one or more users, distribution lists or rooms for a time window, with their busy items, availability view and working hours. Use it to check availability before Create Event. Works only for work or school accounts, not personal Microsoft accounts.',
    idempotent: true,
  },
  props: {
    schedules: Property.Array({
      displayName: 'Email Addresses',
      description:
        'Email addresses of the users, distribution lists or resources to get availability for.',
      required: true,
    }),
    startTime: Property.ShortText({
      displayName: 'Start Time',
      description:
        'Start of the window, as a local date-time without offset, e.g. "2026-03-15T09:00:00".',
      required: true,
    }),
    endTime: Property.ShortText({
      displayName: 'End Time',
      description:
        'End of the window, as a local date-time without offset, e.g. "2026-03-15T18:00:00".',
      required: true,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'Time zone of Start Time and End Time, e.g. "Pacific Standard Time" or "Europe/London" (see Get Supported Time Zones). Defaults to UTC.',
      required: false,
    }),
    availabilityViewInterval: Property.Number({
      displayName: 'Availability View Interval',
      description:
        'Length in minutes of each slot in the availability view (5-1440). Defaults to 30.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { schedules, startTime, endTime, availabilityViewInterval } = propsValue;
    const timeZone = propsValue.timeZone || 'UTC';
    if (
      schedules.length === 0 ||
      !schedules.every((s): s is string => typeof s === 'string' && s !== '')
    ) {
      throw new Error('Email Addresses must be a non-empty list of email address strings.');
    }
    const response: OutlookCalendarPage<ScheduleInformation> = await outlookCalendarClient
      .create({ auth })
      .api('/me/calendar/getSchedule')
      .post({
        schedules,
        startTime: { dateTime: startTime, timeZone },
        endTime: { dateTime: endTime, timeZone },
        ...(availabilityViewInterval !== undefined ? { availabilityViewInterval } : {}),
      });
    return response;
  },
});
