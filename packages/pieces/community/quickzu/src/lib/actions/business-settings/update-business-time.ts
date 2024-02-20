import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient } from '../../common';
import { BusinessTimingInput } from '../../common/types';

export const updateBusinessTimeAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_update_business_time',
  displayName: 'Update Business Time',
  description: 'Updates business hours.',
  props: {
    items: Property.Array({
      displayName: 'Business Hours',
      required: true,
      properties: {
        weekday: Property.StaticDropdown({
          displayName: 'Day',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'Sunday', value: '0' },
              { label: 'Monday', value: '1' },
              { label: 'Tuesday', value: '2' },
              { label: 'Wednesday', value: '3' },
              { label: 'Thursday', value: '4' },
              { label: 'Friday', value: '5' },
              { label: 'Saturday', value: '6' },
            ],
          },
        }),
        start: Property.ShortText({
          displayName: 'Start Time',
          description: 'Please use 24:00 hour format',
          required: true,
        }),
        end: Property.ShortText({
          displayName: 'Start Time',
          description: 'Please use 24:00 hour format',
          required: true,
        }),
        status: Property.Checkbox({
          displayName: 'Status',
          required: true,
          defaultValue: true,
        }),
      },
    }),
  },
  async run(context) {
    const items = context.propsValue.items as BusinessDayHour[];
    const input: BusinessTimingInput = {
      timing: {},
    };
    for (const day of items) {
      input.timing[day.weekday] = {
        start: day.start,
        end: day.end,
        status: day.status,
      };
    }

    const client = makeClient(context.auth);
    return await client.updateBusinessTime(input);
  },
});

type BusinessDayHour = {
  weekday: string;
  start: string;
  end: string;
  status: boolean;
};
