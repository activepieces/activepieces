import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { featuresVoteAuth } from '../auth';
import { featuresVoteApiCall } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof featuresVoteAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const response = await featuresVoteApiCall<{ data: Array<{ id: string; created_at: string; [key: string]: unknown }> }>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/features',
      queryParams: {
        limit: '100',
      },
    });
    const features = response.body.data ?? [];
    return features
      .filter((feature) => new Date(feature.created_at).getTime() > lastFetchEpochMS)
      .map((feature) => ({
        epochMilliSeconds: new Date(feature.created_at).getTime(),
        data: feature,
      }));
  },
};

export const newFeatureTrigger = createTrigger({
  auth: featuresVoteAuth,
  name: 'new_feature',
  displayName: 'New Feature Request',
  description: 'Triggers when a new feature request is created on your board.',
  props: {},
  sampleData: {
    id: 'abc-123',
    title: 'Add dark mode',
    description: 'Support dark theme across the app',
    status: 'Pending',
    total_votes: 0,
    tags: ['UI'],
    created_at: '2024-01-01T00:00:00Z',
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