import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { getCalendars } from './helpers';
import { weblingAuth } from '../../index';

export const weblingCommon = {
  calendarDropdown: () => {
    return Property.Dropdown<string>({
      displayName: 'Calendar',
      refreshers: [],
      required: true,
      options: async ({ auth }) => {
        const authProp = auth as PiecePropValueSchema<typeof weblingAuth>;
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
