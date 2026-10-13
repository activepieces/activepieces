import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import type { AppBskyActorDefs, AtpAgent } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { newFollowerTriggerOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyPolling, PageFetcher } from '../common/polling';
import { blueskyRefs } from '../common/refs';

const STORE_KEY = 'bluesky_followers_poll';
const FOLLOWER_SEEN_CAP = 1000;
const FOLLOWER_SEED_PAGES = 10;

export const newFollowerOnAccount = createTrigger({
  auth: blueskyAuth,
  name: 'newFollowerOnAccount',
  classification: 'READ',
  displayName: 'New Follower on Account',
  description: 'Triggers when someone new follows your Bluesky account',
  aiMetadata: {
    description:
      'Fires when a new account follows the authenticated Bluesky account; each event represents one new follower and carries that follower\'s profile details. An account that unfollows and follows again does not fire twice.',
  },
  props: {},
  sampleData: {
    did: 'did:plc:example123',
    handle: 'newfollower.bsky.social',
    displayName: 'New Follower',
    description: 'A new user who just followed your account',
    avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
    banner: '',
    url: 'https://bsky.app/profile/newfollower.bsky.social',
    followersCount: 0,
    followsCount: 0,
    postsCount: 0,
    indexedAt: '2024-01-01T12:00:00.000Z',
    viewer: {
      muted: false,
      blockedBy: false,
      following: 'at://did:plc:example123/app.bsky.graph.follow/example456',
      followedBy: 'at://did:plc:example456/app.bsky.graph.follow/example789',
    },
    labels: [],
    createdAt: '2023-06-01T12:00:00.000Z',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: newFollowerTriggerOutputSchema,
  async test(context) {
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read your followers',
      fn: (agent) => blueskyPolling.sample({ fetchPage: followersPage({ agent }) }),
    });
  },
  async onEnable(context) {
    await blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read your followers',
      fn: (agent) =>
        blueskyPolling.onEnable({
          store: context.store,
          storeKey: STORE_KEY,
          fetchPage: followersPage({ agent }),
          isRepublish: context.isRepublish,
          seenCap: FOLLOWER_SEEN_CAP,
          seedPages: FOLLOWER_SEED_PAGES,
        }),
    });
  },
  async onDisable(context) {
    await blueskyPolling.onDisable({ store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'read your followers',
      fn: (agent) =>
        blueskyPolling.poll({
          store: context.store,
          storeKey: STORE_KEY,
          fetchPage: followersPage({ agent }),
          seenCap: FOLLOWER_SEEN_CAP,
          seedPages: FOLLOWER_SEED_PAGES,
        }),
    });
  },
});

function followersPage({ agent }: { agent: AtpAgent }): PageFetcher<ReturnType<typeof followerItem>> {
  return async ({ cursor }) => {
    const response = await agent.getFollowers({ actor: blueskyClient.sessionDid(agent), limit: 100, cursor });
    const now = Date.now();
    return {
      items: response.data.followers.map((follower) => ({ key: follower.did, time: now, data: followerItem(follower) })),
      cursor: response.data.cursor,
      oldestTime: undefined,
      newestTime: undefined,
    };
  };
}

function followerItem(follower: AppBskyActorDefs.ProfileView) {
  return {
    did: follower.did,
    handle: follower.handle,
    displayName: follower.displayName || follower.handle,
    description: follower.description || '',
    avatar: follower.avatar || '',
    banner: '',
    url: blueskyRefs.profileWebUrl(follower.handle === 'handle.invalid' ? follower.did : follower.handle),
    followersCount: 0,
    followsCount: 0,
    postsCount: 0,
    indexedAt: follower.indexedAt || new Date().toISOString(),
    viewer: follower.viewer || {},
    labels: follower.labels || [],
    createdAt: follower.createdAt || null,
  };
}
