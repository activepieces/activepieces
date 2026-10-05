import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import type { AtpAgent } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { notificationTriggerOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyMappers } from '../common/mappers';
import { blueskyCompose } from '../common/compose';
import { blueskyPolling, PageFetcher } from '../common/polling';

const STORE_KEY = 'bluesky_notification_poll';
const DEFAULT_REASONS = ['mention', 'reply', 'quote'];

export const newNotification = createTrigger({
  auth: blueskyAuth,
  name: 'new_notification',
  classification: 'READ',
  displayName: 'New Notification',
  description: 'Triggers when you get a new notification (mention, reply, quote, like, repost, follow and more)',
  aiMetadata: {
    description:
      'Fires once per new notification of the authenticated Bluesky account whose type is in the chosen list (default: mentions, replies and quotes; likes, reposts, follows and others can be added). It never marks notifications as seen, and it follows the account\'s notification settings, for example "only from people I follow".',
  },
  props: {
    reasons: blueskyProps.notificationReasonsProperty({
      defaultValue: DEFAULT_REASONS,
      description: 'Which notification types trigger the flow. Leave empty for all types.',
    }),
  },
  sampleData: {
    uri: 'at://did:plc:example123/app.bsky.feed.post/3kexample',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    reason: 'mention',
    reasonSubject: null,
    isRead: false,
    indexedAt: '2026-10-05T12:00:00.000Z',
    author: {
      did: 'did:plc:example123',
      handle: 'friend.bsky.social',
      displayName: 'A Friend',
      description: '',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
      url: 'https://bsky.app/profile/friend.bsky.social',
      createdAt: '2024-01-01T12:00:00.000Z',
      indexedAt: '2024-01-01T12:00:00.000Z',
      viewer: { muted: false, blockedBy: false },
      labels: [],
    },
    text: 'Hey @you.bsky.social, have a look at this!',
    record: { $type: 'app.bsky.feed.post', text: 'Hey @you.bsky.social, have a look at this!', createdAt: '2026-10-05T12:00:00.000Z' },
    url: 'https://bsky.app/profile/friend.bsky.social/post/3kexample',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: notificationTriggerOutputSchema,
  async test(context) {
    const reasons = reasonsFrom(context.propsValue.reasons);
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read notifications',
      fn: (agent) => blueskyPolling.sample({ fetchPage: notificationPage({ agent, reasons }) }),
    });
  },
  async onEnable(context) {
    const reasons = reasonsFrom(context.propsValue.reasons);
    await blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read notifications',
      fn: (agent) =>
        blueskyPolling.onEnable({ store: context.store, storeKey: STORE_KEY, fetchPage: notificationPage({ agent, reasons }), isRepublish: context.isRepublish }),
    });
  },
  async onDisable(context) {
    await blueskyPolling.onDisable({ store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const reasons = reasonsFrom(context.propsValue.reasons);
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read notifications',
      fn: (agent) => blueskyPolling.poll({ store: context.store, storeKey: STORE_KEY, fetchPage: notificationPage({ agent, reasons }) }),
    });
  },
});

function reasonsFrom(raw: unknown): string[] {
  return blueskyCompose.stringList(raw);
}

function notificationPage({ agent, reasons }: { agent: AtpAgent; reasons: string[] }): PageFetcher<ReturnType<typeof blueskyMappers.notificationItem>> {
  return async ({ cursor }) => {
    const response = await agent.listNotifications({ limit: 100, cursor, ...(reasons.length > 0 ? { reasons } : {}) });
    const items = response.data.notifications.map((notification) => ({
      key: `${notification.reason}:${notification.uri}`,
      time: blueskyPolling.timeOf(notification.indexedAt) ?? 0,
      data: blueskyMappers.notificationItem(notification),
    }));
    return { items, cursor: response.data.cursor, ...blueskyPolling.pageTimes(items.map((item) => item.time)) };
  };
}
