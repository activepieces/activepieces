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
    id: 8193592318236,
    url: 'https://activepieceshelp.zendesk.com/api/v2/users/8193592318236.json',
    name: 'John Doe',
    email: 'john.doe@example.com',
    created_at: '2023-03-25T02:39:41Z',
    updated_at: '2023-03-25T02:39:41Z',
    time_zone: 'UTC',
    iana_time_zone: 'Etc/UTC',
    phone: null,
    shared_phone_number: null,
    photo: null,
    locale_id: 1,
    locale: 'en-us',
    organization_id: 8193599387420,
    role: 'end-user',
    verified: true,
    external_id: null,
    tags: [],
    alias: null,
    active: true,
    shared: false,
    shared_agent: false,
    last_login_at: null,
    two_factor_auth_enabled: false,
    signature: null,
    details: null,
    notes: null,
    custom_role_id: null,
    moderator: false,
    ticket_restriction: 'requested',
    only_private_comments: false,
    restricted_agent: false,
    suspended: false,
    chat_only: false,
    default_group_id: null,
    report_csv: false,
    user_fields: {},
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
    url: `https://${subdomain}.zendesk.com/api/v2/users.json?sort_order=desc&sort_by=created_at&per_page=200`,
    method: HttpMethod.GET,
    authentication: {
      type: AuthenticationType.BASIC,
      username: email + '/token',
      password: token,
    },
  });
  return response.body.users;
} 