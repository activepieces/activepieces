import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';
import { googleCalendarAuth } from '../../'; 
import { googleCalendarCommon } from '../common';
import { getCalendars } from '../common/helper';
import dayjs from 'dayjs';


interface FreeBusyResponse {
  kind: 'calendar#freeBusy';
  timeMin: string;
  timeMax: string;
  calendars: {
    [calendarId: string]: {
      busy: {
        start: string;
        end: string;
      }[];
      errors?: {
        domain: string;
        reason: string;
      }[];
    };
  };
}

export const findFreeBusy = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_find_busy_free_periods',
  displayName: 'Find Busy/Free Periods in Calendar',
  description: 'Finds free/busy calendar details from Google Calendar.',
  props: {
    calendar_ids: Property.MultiSelectDropdown({
      displayName: 'Calendars',
      description: 'Select the calendars to check for busy periods.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const authProp = auth as OAuth2PropertyValue;
        const calendars = await getCalendars(authProp);
        return {
          disabled: false,
          options: calendars.map((calendar) => {
            return {
              label: calendar.summary,
              value: calendar.id,
            };
          }),
        };
      },
    }),
    start_date: Property.DateTime({
      displayName: 'Start Time',
      description: 'The start of the time range to check.',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End Time',
      description: 'The end of the time range to check.',
      required: true,
    }),
  },
  async run(context) {
    const { calendar_ids, start_date, end_date } = context.propsValue;
    const { access_token } = context.auth;

    const requestBody = {
      
      timeMin: dayjs(start_date).toISOString(),
      timeMax: dayjs(end_date).toISOString(),
      
      items: calendar_ids.map((id) => ({ id })),
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${googleCalendarCommon.baseUrl}/freeBusy`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
    };

    const response = await httpClient.sendRequest<FreeBusyResponse>(request);
    
    
    return response.body;
  },
});
