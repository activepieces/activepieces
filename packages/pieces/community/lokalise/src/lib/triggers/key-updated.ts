import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { lokaliseAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { projectDropdown } from '../common/props';

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

    return keys.keys
      .filter(
        (key: { modified_at_timestamp: number }) =>
          key.modified_at_timestamp * 1000 > lastFetchEpochMS
      )
      .map((key: any) => ({
        epochMilliSeconds: key.modified_at_timestamp * 1000,
        data: key,
      }));
  },
};

export const keyUpdated = createTrigger({
  auth: lokaliseAuth,
  name: 'keyUpdated',
  displayName: 'Key Updated',
  description: 'Trigger when a key is updated in your Lokalise project',
  props: { projectId: projectDropdown },
  sampleData: {
    event: 'project.key.modified',
    key: {
      id: 782130622,
      name: 'test update key',
      previous_name: 'welcome_header',
      filenames: { ios: null, android: null, web: null, other: null },
      tags: [],
      hidden: false,
      screenshots: [],
    },
    project: { id: '30473913695e05bacfe965.32690341', name: 'test' },
    user: {
      full_name: 'jon ',
      email: 'jon@example.com',
    },
    created_at: '2026-01-09 07:43:32',
    created_at_timestamp: 1767941012,
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
