import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { freeAgentAuth } from '../../index';

const props = {
  view: Property.StaticDropdown({
    displayName: 'User Type',
    description: 'Filter users by type',
    required: false,
    options: {
      options: [
        { label: 'All Users', value: 'all' },
        { label: 'Staff', value: 'staff' },
        { label: 'Active Staff', value: 'active_staff' },
        { label: 'Advisors', value: 'advisors' },
        { label: 'Active Advisors', value: 'active_advisors' },
      ],
    },
    defaultValue: 'all',
  }),
};

type PropsValue = {
  view?: string;
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof freeAgentAuth>,
  PropsValue
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { view } = propsValue;

    let url = 'https://api.freeagent.com/v2/users?';

    if (view && view !== 'all') {
      url += `view=${view}&`;
    }

    if (lastFetchEpochMS > 0) {
      const updatedSince = new Date(lastFetchEpochMS).toISOString();
      url += `updated_since=${encodeURIComponent(updatedSince)}&`;
    }

    url = url.replace(/&$/, '');

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });

    const users = response.body['users'] || [];

    return users.map((user: { created_at: string }) => ({
      epochMilliSeconds: new Date(user.created_at).getTime(),
      data: user,
    }));
  },
};

export const freeAgentNewUserTrigger = createTrigger({
  auth: freeAgentAuth,
  name: 'new_user',
  displayName: 'New User',
  description: 'Triggers when a new user is added',
  type: TriggerStrategy.POLLING,
  props,
  sampleData: {
    url: 'https://api.freeagent.com/v2/users/1',
    first_name: 'Development',
    last_name: 'Team',
    email: 'dev@example.com',
    role: 'Director',
    permission_level: 8,
    ni_number: 'QQ123456C',
    unique_tax_reference: '1234567890',
    opening_mileage: 0,
    created_at: '2011-07-28T11:25:11Z',
    updated_at: '2011-08-24T08:10:23Z',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
