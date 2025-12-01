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
        const authProp = auth;
        const calendars = await getCalendars(authProp);
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
