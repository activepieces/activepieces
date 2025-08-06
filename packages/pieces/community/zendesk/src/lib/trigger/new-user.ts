import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { zendeskAuth } from '../..';

export const newUser = createTrigger({
  auth: zendeskAuth,
  name: 'new_user',
  displayName: 'New User',
  description: 'Triggers when a new user is created',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 123456789,
    url: 'https://activepieceshelp.zendesk.com/api/v2/users/123456789.json',
    name: 'John Doe',
    email: 'john.doe@example.com',
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
    time_zone: 'America/New_York',
    phone: '+1-555-123-4567',
    shared_phone_number: false,
    photo: null,
    locale_id: 1,
    locale: 'en-us',
    organization_id: 123456789,
    role: 'end-user',
    verified: true,
    external_id: null,
    tags: [],
    alias: null,
    active: true,
    shared: false,
    shared_agent: false,
    last_login_at: '2023-03-25T02:39:41Z',
    two_factor_auth_enabled: false,
    signature: null,
    details: null,
    notes: null,
    group_id: null,
    restricted_agent: false,
    suspended: false,
    chat_only: false,
    iana_time_zone: 'America/New_York',
    customer_role_id: 123456789,
    moderator: false,
    only_private_comments: false,
    ticket_restriction: 'requested',
    user_fields: [],
  },
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

type AuthProps = {
  email: string;
  token: string;
  subdomain: string;
};

const polling: Polling<AuthProps, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const items = await getUsers(auth);
    return items.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
};

async function getUsers(authentication: AuthProps) {
  const { email, token, subdomain } = authentication;
  const response = await httpClient.sendRequest<{ users: Array<{ id: number; [key: string]: unknown }> }>({
    url: `https://${subdomain}.zendesk.com/api/v2/users.json?sort_order=desc&sort_by=created_at&per_page=50`,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
    timeout: 30000, // 30 seconds timeout
    retries: 3, // Retry up to 3 times on failure
  });
  return response.body.users;
} 