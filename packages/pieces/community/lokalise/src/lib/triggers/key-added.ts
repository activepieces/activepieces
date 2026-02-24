import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { makeRequest } from '../common/client';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof lokaliseAuth>,
  { projectId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const keys = (await makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/projects/${propsValue.projectId}/keys`
    )) as any;
    console.log(keys)
    return keys.keys
      .filter(
        (key: { created_at_timestamp: number }) =>
          key.created_at_timestamp * 1000 > lastFetchEpochMS
      )
      .map((key: any) => ({
        epochMilliSeconds: key.created_at_timestamp * 1000,
        data: key,
      }));
  },
};

export const keyAdded = createTrigger({
  auth: lokaliseAuth,
  name: 'keyAdded',
  displayName: 'Key Added',
  description: 'Trigger when a new key is added to your Lokalise project',
  props: {
    projectId: projectDropdown,
  },
  sampleData: {
    event: 'project.key.added',
    key: {
      id: 783570856,
      name: 'index.welcome',
      base_value: null,
      filenames: {
        ios: null,
        android: null,
        web: null,
        other: null,
      },
      tags: [],
    },
    project: {
      id: 'aasasasasas',
      name: 'test',
    },
    user: {
      full_name: 'fadse',
      email: 'sasdf@gmail.com',
    },
    created_at: '2026-01-09 07:38:20',
    created_at_timestamp: 1767940700,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },

  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
