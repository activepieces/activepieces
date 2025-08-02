import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { blueskyAuth } from '../common/auth';
import { createBlueskyAgent } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof blueskyAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    try {
      const agent = await createBlueskyAgent(auth);
      
      // Get the user's timeline using app.bsky.feed.getTimeline
      const response = await agent.getTimeline({
        algorithm: 'reverse-chronological', // Get chronological feed
        limit: 50 // Get recent posts
      });

      if (!response.data?.feed || !Array.isArray(response.data.feed)) {
        return [];
      }

      // Filter posts since last fetch
      const cutoffTime = lastFetchEpochMS || 0;

      return response.data.feed
        .filter((item: any) => {
          if (!item.post || !item.post.indexedAt) return false;
          
          const postTime = dayjs(item.post.indexedAt).valueOf();
          return postTime > cutoffTime;
        })
        .map((item: any) => ({
          epochMilliSeconds: dayjs(item.post.indexedAt).valueOf(),
          data: {
            // Post information
            uri: item.post.uri,
            cid: item.post.cid,
            author: item.post.author,
            record: item.post.record,
            indexedAt: item.post.indexedAt,
            
            // Engagement metrics
            replyCount: item.post.replyCount || 0,
            repostCount: item.post.repostCount || 0,
            likeCount: item.post.likeCount || 0,
            quoteCount: item.post.quoteCount || 0,
            
            // Additional metadata
            labels: item.post.labels || [],
            viewer: item.post.viewer || {},
            embed: item.post.embed || null,
            
            // Feed context (repost reason, etc.)
            reason: item.reason || null, // If this is a repost
            reply: item.reply || null, // If this is a reply context
            
            // Feed metadata
            feedContext: {
              isRepost: !!item.reason,
              repostBy: item.reason?.by || null,
              isReply: !!item.reply,
              replyToPost: item.reply?.parent || null,
              replyToRoot: item.reply?.root || null
            }
          }
        }))
        .sort((a: any, b: any) => b.epochMilliSeconds - a.epochMilliSeconds); // Most recent first

    } catch (error) {
      console.error('Error fetching timeline:', error);
      return [];
    }
  }
};

export const newTimelinePosts = createTrigger({
  auth: blueskyAuth,
  name: 'newTimelinePosts',
  displayName: 'New Timeline Posts',
  description: 'Triggers when new posts appear in your "Following" feed (chronological timeline)',
  props: {},
  sampleData: {
    // Post information
    uri: 'at://did:plc:example123/app.bsky.feed.post/example456',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    author: {
      did: 'did:plc:example123',
      handle: 'author.bsky.social',
      displayName: 'Example Author',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
      viewer: {
        muted: false,
        blockedBy: false,
        following: 'at://did:plc:user456/app.bsky.graph.follow/example789'
      }
    },
    record: {
      $type: 'app.bsky.feed.post',
      createdAt: '2024-01-01T12:00:00.000Z',
      text: 'This is a new post in your timeline!',
      langs: ['en']
    },
    indexedAt: '2024-01-01T12:00:00.000Z',
    
    // Engagement metrics
    replyCount: 3,
    repostCount: 8,
    likeCount: 15,
    quoteCount: 2,
    
    // Additional metadata
    labels: [],
    viewer: {
      repost: null,
      like: null
    },
    embed: null,
    
    // Feed context
    reason: null, // No repost reason (original post)
    reply: null, // Not a reply
    feedContext: {
      isRepost: false,
      repostBy: null,
      isReply: false,
      replyToPost: null,
      replyToRoot: null
    }
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