import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  MarkdownVariant,
  Property,
  StaticPropsValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { mastodonAuth } from '../..';
import { mastodonPolling } from '../common/polling';
import { mastodonSampleData } from '../common/sample-data';
import { notificationOutputSchema } from '../output-schemas';

const props = {
  mention_info: Property.MarkDown({
    value:
      'On Mastodon 4.3 and later, mentions from people you do not follow can be filtered and only trigger once you accept them.',
    variant: MarkdownVariant.WARNING,
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof mastodonAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId }) =>
    mastodonPolling.fetchNewItems({
      auth: auth.props,
      path: '/api/v1/notifications',
      query: { types: ['mention'] },
      lastItemId,
      operation: 'New Mention',
      scope: 'read:notifications',
    }),
};

export const newMention = createTrigger({
  auth: mastodonAuth,
  name: 'new_mention',
  classification: 'READ',
  displayName: 'New Mention',
  description: 'Triggers when someone mentions your account, including replies and direct messages.',
  aiMetadata: {
    description:
      'Fires once per new mention notification of the connected account (a post, reply or direct message that @mentions it); the payload is the notification with the mentioning account and the full status. Mentions filtered by the account\'s notification policy (by default, private mentions from accounts it does not follow on Mastodon 4.3+) do not fire until accepted.',
  },
  props,
  sampleData: mastodonSampleData.mentionNotification,
  outputSchema: notificationOutputSchema,
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
