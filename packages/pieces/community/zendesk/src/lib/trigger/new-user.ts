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
  sampleData: undefined,
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