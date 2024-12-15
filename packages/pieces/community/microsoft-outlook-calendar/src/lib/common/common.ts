import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

export const outlookCalendarCommon = {
  baseUrl: 'https://graph.microsoft.com/v1.0/me',
  calendarDropdown: Property.Dropdown({
    displayName: 'Calendar',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const calendars: { id: string; name: string }[] = (
        await httpClient.sendRequest<{ value: { id: string; name: string }[] }>(
          {
            method: HttpMethod.GET,
            url: `${outlookCalendarCommon.baseUrl}/calendars`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: authProp['access_token'],
            },
          }
        )
      ).body.value;
      return {
        disabled: false,
        options: calendars.map((calendar: { id: string; name: string }) => {
          return {
            label: calendar.name,
            value: calendar.id,
          };
        }),
      };
    },
    refreshers: [],
  }),
  timezoneDropdown: Property.Dropdown({
    displayName: 'Timezone',
    required: true,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const timezones: { displayName: string; alias: string }[] = (
        await httpClient.sendRequest<{
          value: { displayName: string; alias: string }[];
        }>({
          method: HttpMethod.GET,
          url: `${outlookCalendarCommon.baseUrl}/outlook/supportedTimeZones`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authProp['access_token'],
          },
        })
      ).body.value;
      return {
        disabled: false,
        options: timezones.map(
          (timezone: { displayName: string; alias: string }) => {
            return {
              label: timezone.displayName,
              value: timezone.alias,
            };
          }
        ),
      };
    },
    refreshers: [],
  }),
};
