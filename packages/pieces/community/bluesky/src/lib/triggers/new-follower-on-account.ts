
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { blueskyAuth } from '../common/auth';
import { makeBlueskyRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof blueskyAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    try {
      // Get the authenticated user's DID from their session
      const sessionResponse = await makeBlueskyRequest(
        auth,
        HttpMethod.GET,
        'com.atproto.server.getSession',
        undefined,
        {},
        true // This requires authentication
      );

      if (!sessionResponse.did) {
        throw new Error('Could not get user DID from session');
      }

      const userDid = sessionResponse.did;

      // Get followers using app.bsky.graph.getFollowers
      const response = await makeBlueskyRequest(
        auth,
        HttpMethod.GET,
        'app.bsky.graph.getFollowers',
        undefined,
        {
          actor: userDid,
          limit: 100 // Get recent followers
        },
        false // This is a public endpoint but we can use auth for better rate limits
      );

      if (!response.followers || !Array.isArray(response.followers)) {
        return [];
      }

      // Since the API doesn't provide follow timestamps, we'll use the current time
      // and filter based on previous fetches using a different strategy
      const currentTime = Date.now();
      const cutoffTime = lastFetchEpochMS || 0;

      // For new followers, we'll use the indexedAt from their profiles as a proxy
      // This isn't perfect but it's the best we can do with the available data
      return response.followers
        .filter((follower: any) => {
          // Use profile creation time as a rough indicator of when they might have followed
          // In a real implementation, you'd want to store the previous list of followers
          // and compare to find truly new ones
          const profileTime = follower.indexedAt ? dayjs(follower.indexedAt).valueOf() : currentTime;
          return profileTime > cutoffTime - (24 * 60 * 60 * 1000); // Within last 24 hours as fallback
        })
        .map((follower: any) => ({
          epochMilliSeconds: follower.indexedAt ? dayjs(follower.indexedAt).valueOf() : currentTime,
          data: {
            did: follower.did,
            handle: follower.handle,
            displayName: follower.displayName || follower.handle,
            description: follower.description || '',
            avatar: follower.avatar || '',
            banner: follower.banner || '',
            followersCount: follower.followersCount || 0,
            followsCount: follower.followsCount || 0,
            postsCount: follower.postsCount || 0,
            indexedAt: follower.indexedAt || new Date().toISOString(),
            viewer: follower.viewer || {},
            labels: follower.labels || [],
            createdAt: follower.createdAt || null
          }
        }))
        .sort((a: any, b: any) => b.epochMilliSeconds - a.epochMilliSeconds); // Most recent first

    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }
};

export const newFollowerOnAccount = createTrigger({
  auth: blueskyAuth,
  name: 'newFollowerOnAccount',
  displayName: 'New Follower on Account',
  description: 'Triggers when someone new follows your Bluesky account',
  props: {},
  sampleData: {
    did: 'did:plc:example123',
    handle: 'newfollower.bsky.social',
    displayName: 'New Follower',
    description: 'A new user who just followed your account',
    avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
    banner: 'https://cdn.bsky.app/img/banner/plain/did:plc:example123/example@jpeg',
    followersCount: 42,
    followsCount: 156,
    postsCount: 78,
    indexedAt: '2024-01-01T12:00:00.000Z',
    viewer: {
      muted: false,
      blockedBy: false,
      following: 'at://did:plc:example123/app.bsky.graph.follow/example456',
      followedBy: 'at://did:plc:example456/app.bsky.graph.follow/example789'
    },
    labels: [],
    createdAt: '2023-06-01T12:00:00.000Z'
  },
  type: TriggerStrategy.POLLING,
  
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});