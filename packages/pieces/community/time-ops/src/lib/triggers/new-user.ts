import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { timeOpsAuth } from '../..';
import { BASE_URL } from '../common';

interface User {
  id: number;
  name: string | null;
  eMail: string | null;
  accessLevel: 'User' | 'ProjectManager' | 'Admin';
  deactivatedAt: string | null;
}

const polling: Polling<AppConnectionValueForAuthProperty<typeof timeOpsAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const response = await httpClient.sendRequest<User[]>({
      method: HttpMethod.GET,
      url: `${BASE_URL}/users`,
      headers: {
        'x-api-key': auth.secret_text,
      },
    });

    const users = response.body ?? [];

    return users
      .sort((a, b) => b.id - a.id)
      .map((user) => ({
        id: user.id,
        data: user,
      }));
  },
};

export const newUser = createTrigger({
  auth: timeOpsAuth,
  name: 'new_user',
  displayName: 'New User',
  description: 'Triggers when a new user has been created.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 1,
    name: 'John Doe',
    eMail: 'john@example.com',
    accessLevel: 'User',
    deactivatedAt: null,
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
