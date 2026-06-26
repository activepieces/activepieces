import { createAction } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { googleCalendarCommon, googleCalendarAuth, getAccessToken } from '../common';

interface CalendarResource {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  description?: string;
  location?: string;
  timeZone: string;
  conferenceProperties?: {
    allowedConferenceSolutionTypes?: string[];
  };
}

export const aiGetCalendar = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_get_calendar',
  displayName: 'Get Calendar',
  description:
    'Fetch one calendar\'s metadata (summary, time zone, description, location) by its calendar ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetch one calendar\'s metadata — summary, timeZone, description, and location — by its calendar ID. Use this to read a calendar\'s time zone, which is load-bearing when constructing correct event start/end windows. Resolve calendarId via google_calendar_list_calendars (default "primary"). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    calendar_id: googleCalendarCommon.calendarDropdown(),
  },
  async run(context) {
    const { calendar_id: calendarId } = context.propsValue;
    const token = await getAccessToken(context.auth);

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${googleCalendarCommon.baseUrl}/calendars/${encodeURIComponent(
        calendarId
      )}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
    };

    try {
      const response = await httpClient.sendRequest<CalendarResource>(request);
      return response.body;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 404) {
        throw new Error(
          `Calendar "${calendarId}" not found. Verify the calendar ID via List Calendars.`
        );
      }
      if (status === 403) {
        throw new Error(
          `Access denied to calendar "${calendarId}". Check your permissions.`
        );
      }
      throw error;
    }
  },
});
