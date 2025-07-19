import { OAuth2PropertyValue, Property } from '@ensemble/pieces-framework';
import { getCalendars, getColors } from './helper';

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
  colorId: Property.Dropdown({
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
      const authProp = auth as OAuth2PropertyValue;
      const response = await getColors(authProp);
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
