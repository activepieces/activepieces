import {
  TriggerStrategy,
  createTrigger,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../../index';
import { ZendeskAuthProps, ZendeskUser } from '../common/types';
import { sampleUser } from '../common/sample-data';

export const newUser = createTrigger({
  auth: zendeskAuth,
  name: 'new_user',
  displayName: 'New User',
  description: 'Fires when a new user is created',
  type: TriggerStrategy.POLLING,
  props: {
    role: Property.StaticDropdown({
      displayName: 'Role Filter (Optional)',
      description: 'Filter users by role. Leave empty to monitor all users.',
      required: false,
      options: {
        placeholder: 'Select user role',
        options: [
          { label: 'End User', value: 'end-user' },
          { label: 'Agent', value: 'agent' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
  },
  sampleData: sampleUser,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});

const polling: Polling<ZendeskAuthProps, { role?: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const users = await getNewUsers(auth, propsValue.role);
    return users.map((user) => ({
      id: user.id,
      data: user,
    }));
  },
};

async function getNewUsers(authentication: ZendeskAuthProps, role?: string) {
  const { email, token, subdomain } = authentication;
  
  let url = `https://${subdomain}.zendesk.com/api/v2/users.json?sort_order=desc&sort_by=created_at&per_page=100`;
  
  // Add role filter if provided
  if (role) {
    url += `&role=${role}`;
  }

  const response = await httpClient.sendRequest<{ users: ZendeskUser[] }>({
    url,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  
  return response.body.users;
}