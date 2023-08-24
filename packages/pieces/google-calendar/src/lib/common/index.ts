import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { getCalendars, listEvents } from './helper';

export const googleCalendarCommon = {
  baseUrl: 'https://www.googleapis.com/calendar/v3',
  calendarDropdown: (minAccessRole?: 'writer') => {
    return Property.Dropdown<string>({
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
        const authProp = auth as OAuth2PropertyValue;
        const calendars = await getCalendars(authProp, minAccessRole);
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
  eventDropdown: (required = true) =>
    Property.Dropdown({
      displayName: 'Event',
      refreshers: ['calendar_id'],
      required,
      options: async ({ auth, calendar_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder:
              'Please connect your account first and select calender',
            options: [],
          };
        }
        const authProp = auth as OAuth2PropertyValue;
        const events = await listEvents(authProp, calendar_id as string);
        return {
          disabled: false,
          options: events.map((event) => {
            return {
              label: event.summary,
              value: event.id,
            };
          }),
        };
      },
    }),
};
