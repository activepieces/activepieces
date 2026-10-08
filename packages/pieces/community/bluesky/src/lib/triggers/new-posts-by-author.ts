import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import type { AppBskyFeedDefs, AtpAgent } from '@atproto/api';
import { blueskyAtproto } from '../common/atproto';
import { blueskyAuth } from '../common/auth';
import { newPostsByAuthorTriggerOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';
import { blueskyPolling, PageFetcher } from '../common/polling';

const STORE_KEY = 'bluesky_author_poll';

export const newPostsByAuthor = createTrigger({
  auth: blueskyAuth,
  name: 'newPostsByAuthor',
  classification: 'READ',
  displayName: 'New Posts by Author',
  description: 'Triggers when a selected author creates a new post',
  aiMetadata: {
    description:
      'Fires when a chosen Bluesky author (picked from your following list or by handle) publishes a new post; each event represents one new post by that author, optionally including their replies and the posts they repost.',
  },
  props: {
    authorSelection: Property.StaticDropdown({
      displayName: 'How to select author?',
      description: 'Choose how to select the author',
      required: true,
      defaultValue: 'following',
      options: {
        options: [
          { label: 'From my following list', value: 'following' },
          { label: 'Enter handle manually', value: 'manual' },
        ],
      },
    }),
    authorFromFollowing: blueskyProps.followingDropdown(),
    authorHandle: Property.ShortText({
      displayName: 'Author Handle',
      description: 'Enter the Bluesky username (e.g., username.bsky.social), a DID or a profile link',
      required: false,
    }),
    includeReplies: Property.Checkbox({
      displayName: 'Include Replies',
      description: 'Include reply posts by this author',
      required: false,
      defaultValue: false,
    }),
    includeReposts: Property.Checkbox({
      displayName: 'Include Reposts',
      description: 'Include posts that this author reposted',
      required: false,
      defaultValue: false,
    }),
  },
  sampleData: {
    uri: 'at://did:plc:example123/app.bsky.feed.post/example456',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    url: 'https://bsky.app/profile/author.bsky.social/post/example456',
    author: {
      did: 'did:plc:example123',
      handle: 'author.bsky.social',
      displayName: 'Example Author',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
      viewer: { muted: false, blockedBy: false, following: 'at://following-record-uri' },
    },
    record: {
      $type: 'app.bsky.feed.post',
      createdAt: '2024-01-01T12:00:00.000Z',
      text: 'Just posted something new! Excited to share this with everyone.',
      langs: ['en'],
    },
    indexedAt: '2024-01-01T12:00:00.000Z',
    replyCount: 3,
    repostCount: 8,
    likeCount: 25,
    quoteCount: 2,
    labels: [],
    viewer: { repost: null, like: null },
    embed: null,
    postContext: {
      authorHandle: 'author.bsky.social',
      isReply: false,
      isRepost: false,
      replyTo: null,
      hasImages: false,
      hasVideo: false,
      hasExternalLink: false,
    },
  },
  type: TriggerStrategy.POLLING,
  outputSchema: newPostsByAuthorTriggerOutputSchema,
  async test(context) {
    const config = authorConfig(context.propsValue);
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: "read the author's posts",
      fn: async (agent) => blueskyPolling.sample({ fetchPage: authorPage({ agent, config, did: await authorDid({ agent, config }) }) }),
    });
  },
  async onEnable(context) {
    const config = authorConfig(context.propsValue);
    await blueskyClient.withBluesky({
      auth: context.auth.props,
      action: "read the author's posts",
      fn: async (agent) =>
        blueskyPolling.onEnable({
          store: context.store,
          storeKey: STORE_KEY,
          fetchPage: authorPage({ agent, config, did: await authorDid({ agent, config }) }),
          isRepublish: context.isRepublish,
        }),
    });
  },
  async onDisable(context) {
    await blueskyPolling.onDisable({ store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const config = authorConfig(context.propsValue);
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: "read the author's posts",
      fn: async (agent) =>
        blueskyPolling.poll({ store: context.store, storeKey: STORE_KEY, fetchPage: authorPage({ agent, config, did: await authorDid({ agent, config }) }) }),
    });
  },
});

function authorConfig(props: {
  authorSelection: string;
  authorFromFollowing?: unknown;
  authorHandle?: string;
  includeReplies?: boolean;
  includeReposts?: boolean;
}): AuthorConfig {
  const raw = props.authorSelection === 'following' ? props.authorFromFollowing : props.authorHandle;
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new Error(
      props.authorSelection === 'following'
        ? 'Select an author from your following list, or switch to "Enter handle manually".'
        : 'Enter the author handle.',
    );
  }
  return {
    actor: blueskyRefs.parseActorInput(raw),
    displayHandle: raw.replace('@', '').trim(),
    includeReplies: props.includeReplies === true,
    includeReposts: props.includeReposts === true,
  };
}

async function authorDid({ agent, config }: { agent: AtpAgent; config: AuthorConfig }): Promise<string> {
  return blueskyRefs.resolveActorDid({ agent, input: config.actor });
}

function authorPage({ agent, config, did }: { agent: AtpAgent; config: AuthorConfig; did: string }): PageFetcher<ReturnType<typeof authorItem>> {
  return async ({ cursor }) => {
    const response = await agent.getAuthorFeed({ actor: did, limit: 100, cursor, filter: 'posts_with_replies' });
    const times = response.data.feed.map((entry) =>
      blueskyPolling.timeOf(entry.reason && blueskyAtproto.isReasonRepost(entry.reason) ? entry.reason.indexedAt : entry.post.indexedAt),
    );
    const items = response.data.feed.flatMap((entry) => {
      const repost = entry.reason && blueskyAtproto.isReasonRepost(entry.reason) ? entry.reason : undefined;
      const isReply = blueskyMappers.recordReplyParentUri(entry.post.record) !== null;
      const ownPost = !entry.reason && entry.post.author.did === did;
      const ownRepost = repost !== undefined && repost.by.did === did;
      if ((!ownPost && !ownRepost) || (ownPost && isReply && !config.includeReplies) || (ownRepost && !config.includeReposts)) {
        return [];
      }
      return [
        {
          key: repost ? `${did}:${entry.post.uri}` : entry.post.uri,
          time: blueskyPolling.timeOf(repost ? repost.indexedAt : entry.post.indexedAt) ?? 0,
          data: authorItem({ entry, config, isRepost: ownRepost }),
        },
      ];
    });
    return { items, cursor: response.data.cursor, ...blueskyPolling.pageTimes(times) };
  };
}

function authorItem({ entry, config, isRepost }: { entry: AppBskyFeedDefs.FeedViewPost; config: AuthorConfig; isRepost: boolean }) {
  const replyTo = blueskyMappers.recordReplyParentUri(entry.post.record);
  return {
    ...blueskyMappers.postBase(entry.post),
    postContext: {
      authorHandle: config.displayHandle,
      isReply: replyTo !== null,
      isRepost,
      replyTo,
      ...blueskyMappers.mediaFlags(entry.post.embed),
    },
  };
}

type AuthorConfig = { actor: string; displayHandle: string; includeReplies: boolean; includeReposts: boolean };
