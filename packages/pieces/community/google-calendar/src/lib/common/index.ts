import { Property } from '@activepieces/pieces-framework';
import { getCalendars, getColors, getEventsForDropdown } from './helper';
import { googleCalendarAuth, GoogleCalendarAuthValue, getAccessToken } from '../auth';

export { googleCalendarAuth, GoogleCalendarAuthValue, getAccessToken, createGoogleClient, googleCalendarScopes } from '../auth';

export const googleCalendarCommon = {
  baseUrl: 'https://www.googleapis.com/calendar/v3',
  calendarDropdown: (minAccessRole?: 'writer') => {
    return Property.Dropdown<string,true,typeof googleCalendarAuth>({
      auth: googleCalendarAuth,
      displayName: 'Calendar',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        const authValue = auth as GoogleCalendarAuthValue;
        const calendars = await getCalendars(authValue, minAccessRole);
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
    });
  },
  eventDropdown: (required = false) => {
    return Property.Dropdown<string,boolean,typeof googleCalendarAuth>({
      displayName: 'Event',
      refreshers: ['calendar_id'],
      required: required,
      auth: googleCalendarAuth,
      options: async ({ auth, calendar_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        if (!calendar_id) {
          return {
            disabled: true,
            placeholder: 'Please select a calendar first',
            options: [],
          };
        }
        const authValue = auth as GoogleCalendarAuthValue;
        const events = await getEventsForDropdown(
          authValue,
          calendar_id as string
        );
        return {
          disabled: false,
          options: events,
        };
      },
    });
  },
  colorId: Property.Dropdown({
    auth: googleCalendarAuth,
    displayName: 'Color',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      const response = await getColors(auth as GoogleCalendarAuthValue);
      return {
        disabled: false,
        options: Object.entries(response.event).map(([key, value]) => {
          return {
            label: value.background,
            value: key,
          };
        }),
      };
    },
  }),
};
