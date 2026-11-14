import { createAction, Property } from '@activepieces/pieces-framework';
import { count } from '../api';
import { buildListDropdown } from '../props';
import { sendyAuth, SendyAuthType } from '../auth';

export const countAction = createAction({
  name: 'count_subscribers',
  classification: 'READ',
  auth: sendyAuth,
  displayName: 'Count Active Subscribers',
  description: 'Count the active subscribers on a list.',
  audience: 'both',
  aiMetadata: { description: 'Returns the number of currently active (confirmed, non-unsubscribed) subscribers in a single Sendy list. Use to report list size or check growth; requires the target list. Read-only and idempotent.', idempotent: true },
  props: {
    list: Property.Dropdown({ 
      auth: sendyAuth,
      displayName: 'List',
      description: 'Only confirmed, subscribed people are counted.',
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
