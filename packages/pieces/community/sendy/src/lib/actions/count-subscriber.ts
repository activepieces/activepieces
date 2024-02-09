import { createAction, Property } from '@activepieces/pieces-framework';
import { count } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';

export const countAction = createAction({
  name: 'count_subscribers',
  auth: sendyAuth,
  displayName: 'Count Active Subscribers',
  description: 'Get the active subscriber count for a list',
  props: {
    list: Property.Dropdown({
      displayName: 'List',
      description: 'Select the list to get the status from',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) =>
        await buildListDropdown(auth as SendyAuthType),
    }),
  },
  async run(context) {
    return await count(context.auth, {
      list_id: context.propsValue.list,
    });
  },
});
