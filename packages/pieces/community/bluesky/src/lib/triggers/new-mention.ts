import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import type { AppBskyFeedDefs, AppBskyNotificationListNotifications, AtpAgent } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { mentionTriggerOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyMappers } from '../common/mappers';
import { blueskyPolling, PageFetcher } from '../common/polling';
import { blueskyRefs } from '../common/refs';

const STORE_KEY = 'bluesky_mention_poll';
const MENTION_REASONS = ['mention', 'reply', 'quote'];
const GET_POSTS_BATCH = 25;

export const newMention = createTrigger({
  auth: blueskyAuth,
  name: 'new_mention',
  classification: 'READ',
  displayName: 'New Mention or Reply',
  description: 'Triggers when someone mentions you, replies to you or quotes your post',
  aiMetadata: {
    description:
      'Fires once per new post that mentions the authenticated Bluesky account, replies to it, or quotes one of its posts, carrying the full post plus why it notified. If the post was deleted or hidden before the poll, it still fires with the notification\'s copy of the post, postAvailable=false and null counts. It follows the account\'s notification settings, for example "only from people I follow", and never marks notifications as seen; use New Notification for likes, reposts or follows.',
  },
  props: {},
  sampleData: {
    uri: 'at://did:plc:example123/app.bsky.feed.post/3kexample',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    url: 'https://bsky.app/profile/friend.bsky.social/post/3kexample',
    author: {
      did: 'did:plc:example123',
      handle: 'friend.bsky.social',
      displayName: 'A Friend',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
    },
    record: { $type: 'app.bsky.feed.post', text: '@you.bsky.social what do you think?', createdAt: '2026-10-05T12:00:00.000Z' },
    indexedAt: '2026-10-05T12:00:00.000Z',
    replyCount: 0,
    repostCount: 0,
    likeCount: 0,
    quoteCount: 0,
    labels: [],
    viewer: {},
    embed: null,
    text: '@you.bsky.social what do you think?',
    notificationReason: 'mention',
    reasonSubject: null,
    isRead: false,
    replyToUri: null,
    postAvailable: true,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: mentionTriggerOutputSchema,
  async test(context) {
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read mentions',
      fn: (agent) => blueskyPolling.sample({ fetchPage: mentionPage({ agent }) }),
    });
  },
  async onEnable(context) {
    await blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read mentions',
      fn: (agent) => blueskyPolling.onEnable({ store: context.store, storeKey: STORE_KEY, fetchPage: mentionPage({ agent }), isRepublish: context.isRepublish }),
    });
  },
  async onDisable(context) {
    await blueskyPolling.onDisable({ store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read mentions',
      fn: (agent) => blueskyPolling.poll({ store: context.store, storeKey: STORE_KEY, fetchPage: mentionPage({ agent }) }),
    });
  },
});

function mentionPage({ agent }: { agent: AtpAgent }): PageFetcher<ReturnType<typeof mentionItem>> {
  return async ({ cursor }) => {
    const response = await agent.listNotifications({ limit: 100, cursor, reasons: MENTION_REASONS });
    const notifications = response.data.notifications.filter((notification) => MENTION_REASONS.includes(notification.reason));
    const posts = await hydrate({ agent, uris: [...new Set(notifications.map((notification) => notification.uri))] });
    const items = notifications.map((notification) => ({
      key: `${notification.reason}:${notification.uri}`,
      time: blueskyPolling.timeOf(notification.indexedAt) ?? 0,
      data: mentionItem({ notification, post: posts.get(notification.uri) }),
    }));
    return {
      items,
      cursor: response.data.cursor,
      ...blueskyPolling.pageTimes(response.data.notifications.map((notification) => blueskyPolling.timeOf(notification.indexedAt))),
    };
  };
}

async function hydrate({ agent, uris }: { agent: AtpAgent; uris: string[] }): Promise<Map<string, AppBskyFeedDefs.PostView>> {
  const batches = Array.from({ length: Math.ceil(uris.length / GET_POSTS_BATCH) }, (_, index) =>
    uris.slice(index * GET_POSTS_BATCH, (index + 1) * GET_POSTS_BATCH),
  );
  const results: AppBskyFeedDefs.PostView[] = [];
  for (const batch of batches) {
    const response = await agent.getPosts({ uris: batch });
    results.push(...response.data.posts);
  }
  return new Map(results.map((post) => [post.uri, post]));
}

function mentionItem({
  notification,
  post,
}: {
  notification: AppBskyNotificationListNotifications.Notification;
  post: AppBskyFeedDefs.PostView | undefined;
}) {
  const notificationFields = {
    notificationReason: notification.reason,
    reasonSubject: notification.reasonSubject ?? null,
    isRead: notification.isRead,
  };
  if (post) {
    return {
      ...blueskyMappers.postBase(post),
      text: blueskyMappers.recordText(post.record),
      ...notificationFields,
      replyToUri: blueskyMappers.recordReplyParentUri(post.record),
      postAvailable: true,
    };
  }
  return {
    uri: notification.uri,
    cid: notification.cid,
    url: blueskyRefs.postWebUrl({ uri: notification.uri, handle: notification.author.handle }),
    author: notification.author,
    record: notification.record,
    indexedAt: notification.indexedAt,
    replyCount: null,
    repostCount: null,
    likeCount: null,
    quoteCount: null,
    labels: notification.labels ?? [],
    viewer: {},
    embed: null,
    text: blueskyMappers.recordText(notification.record),
    ...notificationFields,
    replyToUri: blueskyMappers.recordReplyParentUri(notification.record),
    postAvailable: false,
  };
}
