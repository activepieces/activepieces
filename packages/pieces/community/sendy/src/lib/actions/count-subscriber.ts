import { createAction, Property } from '@activepieces/pieces-framework';
import { count } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';

export const countAction = createAction({
  name: 'count_subscribers',
  auth: sendyAuth,
  displayName: 'Count Active Subscribers',
  description: 'Get the active subscriber count for a list',
  audience: 'both',
  aiMetadata: { description: 'Returns the number of currently active (confirmed, non-unsubscribed) subscribers in a single Sendy list. Use to report list size or check growth; requires the target list. Read-only and idempotent.', idempotent: true },
  props: {
    list: Property.Dropdown({ 
      auth: sendyAuth,
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
