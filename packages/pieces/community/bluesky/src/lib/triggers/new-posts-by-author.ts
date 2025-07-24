
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { blueskyAuth } from '../common/auth';
import { makeBlueskyRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { userHandleProperty } from '../common/props';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof blueskyAuth>, { author: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, auth, lastFetchEpochMS }) => {
    const { author } = propsValue;
    
    try {
      // Normalize the author handle
      const normalizedAuthor = author.replace(/^@/, '').trim();
      
      // Get the author's feed using app.bsky.feed.getAuthorFeed
      const response = await makeBlueskyRequest(
        auth,
        HttpMethod.GET,
        'app.bsky.feed.getAuthorFeed',
        undefined,
        {
          actor: normalizedAuthor,
          limit: 50, // Get recent posts
          filter: 'posts_no_replies' // Only original posts, not replies
        },
        false // This is a public endpoint
      );

      if (!response.feed || !Array.isArray(response.feed)) {
        return [];
      }

      // Filter posts since last fetch if we have a timestamp
      const cutoffTime = lastFetchEpochMS || 0;
      
      return response.feed
        .filter((item: any) => {
          // Only include posts (not reposts) and filter by timestamp
          const isOriginalPost = item.post && item.post.author && !item.reason;
          if (!isOriginalPost) return false;
          
          const postTime = dayjs(item.post.indexedAt).valueOf();
          return postTime > cutoffTime;
        })
        .map((item: any) => ({
          epochMilliSeconds: dayjs(item.post.indexedAt).valueOf(),
          data: {
            uri: item.post.uri,
            cid: item.post.cid,
            author: item.post.author,
            record: item.post.record,
            indexedAt: item.post.indexedAt,
            replyCount: item.post.replyCount || 0,
            repostCount: item.post.repostCount || 0,
            likeCount: item.post.likeCount || 0,
            quoteCount: item.post.quoteCount || 0,
            labels: item.post.labels || [],
            viewer: item.post.viewer || {},
            embed: item.post.embed || null
          }
        }))
        .sort((a: any, b: any) => b.epochMilliSeconds - a.epochMilliSeconds); // Most recent first
        
    } catch (error) {
      console.error('Error fetching author posts:', error);
      return [];
    }
  }
};

export const newPostsByAuthor = createTrigger({
  auth: blueskyAuth,
  name: 'newPostsByAuthor',
  displayName: 'New Posts by Author',
  description: 'Triggers when a selected author creates a new post on Bluesky',
  props: {
    author: userHandleProperty
  },
  sampleData: {
    uri: 'at://did:plc:example123/app.bsky.feed.post/example456',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    author: {
      did: 'did:plc:example123',
      handle: 'example.bsky.social',
      displayName: 'Example User',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
      viewer: {
        muted: false,
        blockedBy: false
      }
    },
    record: {
      $type: 'app.bsky.feed.post',
      createdAt: '2024-01-01T12:00:00.000Z',
      text: 'Hello Bluesky! This is my new post.',
      langs: ['en']
    },
    indexedAt: '2024-01-01T12:00:00.000Z',
    replyCount: 5,
    repostCount: 12,
    likeCount: 25,
    quoteCount: 3,
    labels: [],
    viewer: {
      repost: null,
      like: null
    },
    embed: null
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