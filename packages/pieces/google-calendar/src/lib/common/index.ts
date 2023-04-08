import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { getCalendars } from './helper';

export const googleCalendarCommon = {
  baseUrl: 'https://www.googleapis.com/calendar/v3',
  authentication: Property.OAuth2({
    description: '',
    displayName: 'Authentication',
    authUrl: 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    required: true,
    pkce: true,
    scope: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.readonly'],
  }),
  calendarDropdown: Property.Dropdown<string>({
    displayName: 'Calendar',
    refreshers: ['authentication'],
    required: true,
    options: async (propsValue) => {
      if (!propsValue['authentication']) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      const authProp: OAuth2PropertyValue = propsValue[
        'authentication'
      ] as OAuth2PropertyValue;
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
};
