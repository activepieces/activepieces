import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';
import dayjs from 'dayjs';

export const getTasks = createAction({
  auth: onfleetAuth,
  name: 'get_tasks',
  displayName: 'Get Tasks',
  description: 'Get many task',
  props: {
    from: Property.DateTime({
      displayName: 'From',
      required: true,
    }),
    to: Property.DateTime({
      displayName: 'To',
      required: false,
    }),
    state: Property.MultiSelectDropdown({
      displayName: 'State',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            {
              label: 'Unassigned',
              value: 0,
            },
            {
              label: 'Assigned',
              value: 1,
            },
            {
              label: 'Active',
              value: 2,
            },
            {
              label: 'Completed',
              value: 3,
            },
          ],
        };
      },
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    const from = context.propsValue.from
      ? dayjs(context.propsValue.from).valueOf()
      : undefined;
    const to = context.propsValue.to
      ? dayjs(context.propsValue.to).valueOf()
      : undefined;

    const options: any = {};

    if (from) options.from = from;
    if (to) options.to = to;
    if (context.propsValue.state)
      options.state = context.propsValue.state.join(',');

    return await onfleetApi.tasks.get(options);
  },
});
