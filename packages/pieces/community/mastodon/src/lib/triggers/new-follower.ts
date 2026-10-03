import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonPolling } from '../common/polling';
import { mastodonSampleData } from '../common/sample-data';
import { followNotificationOutputSchema } from '../output-schemas';

const polling: Polling<AppConnectionValueForAuthProperty<typeof mastodonAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId }) =>
    mastodonPolling.fetchNewItems({
      auth: auth.props,
      path: '/api/v1/notifications',
      query: { types: ['follow'] },
      lastItemId,
      operation: 'New Follower',
      scope: 'read:notifications',
    }),
};

export const newFollower = createTrigger({
  auth: mastodonAuth,
  name: 'new_follower',
  classification: 'READ',
  displayName: 'New Follower',
  description:
    'Triggers when someone starts following your account. If your account requires follow approval, people appear here only after you accept their request.',
  aiMetadata: {
    description:
      'Fires once per new follow notification of the connected account; the payload is the notification, and its account field is the new follower (use its id with Follow Account to follow back). Pending follow requests on a locked account do not fire until accepted.',
  },
  props: {},
  sampleData: mastodonSampleData.followNotification,
  outputSchema: followNotificationOutputSchema,
  type: TriggerStrategy.POLLING,
  async test(context) {
    return pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
});
