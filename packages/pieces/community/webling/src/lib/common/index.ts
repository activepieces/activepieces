import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { getCalendars } from './helpers';
import { weblingAuth } from '../../index';

export const weblingCommon = {
  calendarDropdown: () => {
    return Property.Dropdown<string,true,typeof weblingAuth>({
      auth: weblingAuth,
      displayName: 'Calendar',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }
        const calendars = await getCalendars(auth);
        return {
          disabled: false,
          options: calendars.map((calendar) => {
            return {
              label: calendar.properties.title,
              value: calendar.id,
            };
          }),
        };
      },
    });
  },
};
