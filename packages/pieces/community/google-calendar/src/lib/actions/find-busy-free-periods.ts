import { createAction, Property } from '@activepieces/pieces-framework';
import { googleCalendarCommon } from '../common';
import dayjs from 'dayjs';
import { googleCalendarAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const findBusyFreePeriods = createAction({
  auth: googleCalendarAuth,
  name: 'find_busy_free_periods',
  description: 'Find Busy/Free Periods in Calendar',
  displayName: 'Find Busy/Free Periods in Calendar',
  props: {
    timeMin: Property.DateTime({
      displayName: 'Start Date/Time',
      description: 'The start of the interval for the query',
      required: true,
    }),
    timeMax: Property.DateTime({
      displayName: 'End Date/Time',
      description: 'The end of the interval for the query',
      required: true,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'Time zone used in the response (e.g., America/New_York). Optional. The default is UTC.',
      required: false,
    }),
    primary_calendar: googleCalendarCommon.calendarDropdown(),
    additional_calendars: Property.Array({
      displayName: 'Additional Calendar IDs',
      description:
        'List of additional calendar identifiers to query for busy/free information (optional)',
      required: false,
    }),
    groupExpansionMax: Property.Number({
      displayName: 'Group Expansion Max',
      description:
        'Maximal number of calendar identifiers to be provided for a single group. Maximum value is 100.',
      required: false,
    }),
    calendarExpansionMax: Property.Number({
      displayName: 'Calendar Expansion Max',
      description:
        'Maximal number of calendars for which FreeBusy information is to be provided. Maximum value is 50.',
      required: false,
    }),
  },
  async run(configValue) {
    const {
      timeMin,
      timeMax,
      timeZone,
      primary_calendar,
      additional_calendars,
      groupExpansionMax,
      calendarExpansionMax,
    } = configValue.propsValue;

    const authClient = new OAuth2Client();
    authClient.setCredentials(configValue.auth);

    const calendar = google.calendar({ version: 'v3', auth: authClient });

    const calendarIds: string[] = [];
    if (primary_calendar) {
      calendarIds.push(primary_calendar);
    }
    if (additional_calendars && Array.isArray(additional_calendars)) {
      calendarIds.push(
        ...(additional_calendars as string[]).filter((id) => id && id.trim())
      );
    }

    const requestBody: {
      timeMin: string;
      timeMax: string;
      items: { id: string }[];
      timeZone?: string;
      groupExpansionMax?: number;
      calendarExpansionMax?: number;
    } = {
      timeMin: dayjs(timeMin).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
      timeMax: dayjs(timeMax).format('YYYY-MM-DDTHH:mm:ss.sssZ'),
      items: calendarIds.map((calendarId) => ({ id: calendarId })),
    };

    if (timeZone) {
      requestBody.timeZone = timeZone;
    }

    if (groupExpansionMax !== undefined && groupExpansionMax !== null) {
      requestBody.groupExpansionMax = Math.min(groupExpansionMax, 100);
    }

    if (calendarExpansionMax !== undefined && calendarExpansionMax !== null) {
      requestBody.calendarExpansionMax = Math.min(calendarExpansionMax, 50);
    }

    const response = await calendar.freebusy.query({
      requestBody,
    });

    return response.data;
  },
});
