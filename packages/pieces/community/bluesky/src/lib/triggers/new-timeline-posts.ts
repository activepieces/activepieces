import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import type { AppBskyFeedDefs, AtpAgent } from '@atproto/api';
import { blueskyAtproto } from '../common/atproto';
import { blueskyAuth } from '../common/auth';
import { newTimelinePostsTriggerOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyMappers } from '../common/mappers';
import { blueskyPolling, PageFetcher } from '../common/polling';

const STORE_KEY = 'bluesky_timeline_poll';

export const newTimelinePosts = createTrigger({
  auth: blueskyAuth,
  name: 'newTimelinePosts',
  classification: 'READ',
  displayName: 'New Timeline Posts',
  description: 'Triggers when new posts appear in your timeline',
  aiMetadata: {
    description:
      'Fires when a new post or repost appears in the authenticated account\'s home timeline (from accounts it follows); each event is one timeline item, and a repost fires when it is reposted even if the original post is older.',
  },
  props: {},
  sampleData: {
    uri: 'at://did:plc:example123/app.bsky.feed.post/example456',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    url: 'https://bsky.app/profile/author.bsky.social/post/example456',
    author: {
      did: 'did:plc:example123',
      handle: 'author.bsky.social',
      displayName: 'Example Author',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
      viewer: { muted: false, blockedBy: false, following: 'at://did:plc:user456/app.bsky.graph.follow/example789' },
    },
    record: { $type: 'app.bsky.feed.post', createdAt: '2024-01-01T12:00:00.000Z', text: 'This is a new post in your timeline!', langs: ['en'] },
    indexedAt: '2024-01-01T12:00:00.000Z',
    replyCount: 3,
    repostCount: 8,
    likeCount: 15,
    quoteCount: 2,
    labels: [],
    viewer: { repost: null, like: null },
    embed: null,
    reason: null,
    reply: null,
    feedContext: { isRepost: false, repostBy: null, isReply: false, replyToPost: null, replyToRoot: null },
  },
  type: TriggerStrategy.POLLING,
  outputSchema: newTimelinePostsTriggerOutputSchema,
  async test(context) {
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read the timeline',
      fn: (agent) => blueskyPolling.sample({ fetchPage: timelinePage({ agent }) }),
    });
  },
  async onEnable(context) {
    await blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read the timeline',
      fn: (agent) =>
        blueskyPolling.onEnable({ store: context.store, storeKey: STORE_KEY, fetchPage: timelinePage({ agent }), isRepublish: context.isRepublish }),
    });
  },
  async onDisable(context) {
    await blueskyPolling.onDisable({ store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read the timeline',
      fn: (agent) => blueskyPolling.poll({ store: context.store, storeKey: STORE_KEY, fetchPage: timelinePage({ agent }) }),
    });
  },
});

function timelinePage({ agent }: { agent: AtpAgent }): PageFetcher<ReturnType<typeof timelineItem>> {
  return async ({ cursor }) => {
    const response = await agent.getTimeline({ limit: 100, cursor });
    const items = response.data.feed.map((entry) => {
      const repost = entry.reason && blueskyAtproto.isReasonRepost(entry.reason) ? entry.reason : undefined;
      return {
        key: repost ? `${repost.by.did}:${entry.post.uri}` : entry.post.uri,
        time: blueskyPolling.timeOf(repost ? repost.indexedAt : entry.post.indexedAt) ?? 0,
        data: timelineItem(entry),
      };
    });
    return { items, cursor: response.data.cursor, ...blueskyPolling.pageTimes(items.map((item) => item.time)) };
  };
}

function timelineItem(entry: AppBskyFeedDefs.FeedViewPost) {
  return {
    ...blueskyMappers.postBase(entry.post),
    reason: entry.reason ?? null,
    reply: entry.reply ?? null,
    feedContext: {
      isRepost: Boolean(entry.reason),
      repostBy: entry.reason && blueskyAtproto.isReasonRepost(entry.reason) ? entry.reason.by : null,
      isReply: Boolean(entry.reply),
      replyToPost: entry.reply?.parent ?? null,
      replyToRoot: entry.reply?.root ?? null,
    },
  };
}
