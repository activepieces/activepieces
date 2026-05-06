import { createAction, Property } from '@activepieces/pieces-framework';
import {
  flattenRecurlyResourceList,
  listAccountSubscriptions,
  listSubscriptions,
} from '../common/client';
import { recurlyAuth } from '../auth';
import { accountCodeDropdown } from '../common/props';

export const listSubscriptionsAction = createAction({
  auth: recurlyAuth,
  name: 'list_subscriptions',
  displayName: 'List Subscriptions',
  description: 'Browse subscriptions in Recurly, with an option to filter by account and state.',
  props: {
    accountCode: accountCodeDropdown(
      false,
      'Optionally select an account to list only that account’s subscriptions.',
    ),
    state: Property.StaticDropdown({
      displayName: 'Subscription State',
      description: 'Filter subscriptions by state.',
      required: false,
      defaultValue: 'active',
      options: {
        options: [
          {
            label: 'Active',
            value: 'active',
          },
          {
            label: 'Canceled',
            value: 'canceled',
          },
          {
            label: 'Expired',
            value: 'expired',
          },
          {
            label: 'Future',
            value: 'future',
          },
          {
            label: 'Paused',
            value: 'paused',
          },
          {
            label: 'All',
            value: '',
          },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'The maximum number of subscriptions to return.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 50;
    const params: Record<string, string | number> = {
      limit,
    };

    if (context.propsValue.state) {
      params['state'] = context.propsValue.state;
    }

    const subscriptions = context.propsValue.accountCode
      ? await listAccountSubscriptions(
        context.auth,
        context.propsValue.accountCode,
        params,
        limit,
      )
      : await listSubscriptions(context.auth, params, limit);

    return flattenRecurlyResourceList(subscriptions);
  },
});
