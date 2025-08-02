import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { blueskyAuth } from '../common/auth';
import { createBlueskyAgent } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof blueskyAuth>, { 
  authorHandle: string;
  includeReplies?: boolean;
  includeReposts?: boolean;
}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { authorHandle, includeReplies = false, includeReposts = false } = propsValue;
    
    try {
      if (!authorHandle || authorHandle.trim().length === 0) {
        return [];
      }

      const agent = await createBlueskyAgent(auth);
      
      // Normalize the handle (remove @ if present)
      const normalizedHandle = authorHandle.replace('@', '').trim();
      
      // Get the author's feed using app.bsky.feed.getAuthorFeed
      const response = await agent.getAuthorFeed({
        actor: normalizedHandle,
        limit: 50,
        filter: 'posts_with_replies' // Get all posts including replies
      });

      if (!response.data?.feed || !Array.isArray(response.data.feed)) {
        return [];
      }

      // Filter posts since last fetch
      const cutoffTime = lastFetchEpochMS || 0;

      return response.data.feed
        .filter((feedItem: any) => {
          const post = feedItem.post;
          if (!post || !post.indexedAt) return false;
          
          // Check if post is newer than last fetch
          const postTime = dayjs(post.indexedAt).valueOf();
          if (postTime <= cutoffTime) return false;

          // Filter based on post type preferences
          const isReply = post.record?.reply !== undefined;
          const isRepost = feedItem.reason?.$type === 'app.bsky.feed.defs#reasonRepost';
          
          // Apply filters
          if (isReply && !includeReplies) return false;
          if (isRepost && !includeReposts) return false;
          
          // Only include posts by the specified author (not reposts by others)
          return post.author.handle === normalizedHandle || post.author.did === normalizedHandle;
        })
        .map((feedItem: any) => {
          const post = feedItem.post;
          return {
            epochMilliSeconds: dayjs(post.indexedAt).valueOf(),
            data: {
              // Core post information
              uri: post.uri,
              cid: post.cid,
              author: post.author,
              record: post.record,
              indexedAt: post.indexedAt,
              
              // Engagement metrics
              replyCount: post.replyCount || 0,
              repostCount: post.repostCount || 0,
              likeCount: post.likeCount || 0,
              quoteCount: post.quoteCount || 0,
              
              // Additional metadata
              labels: post.labels || [],
              viewer: post.viewer || {},
              embed: post.embed || null,
              
              // Post context
              postContext: {
                authorHandle: normalizedHandle,
                isReply: post.record?.reply !== undefined,
                isRepost: feedItem.reason?.$type === 'app.bsky.feed.defs#reasonRepost',
                replyTo: post.record?.reply?.parent?.uri || null,
                hasImages: !!(post.embed?.images),
                hasVideo: !!(post.embed?.video),
                hasExternalLink: !!(post.embed?.external)
              }
            }
          };
        })
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
  description: 'Fires when a selected author creates a new post',
  props: {
    authorHandle: Property.ShortText({
      displayName: 'Author Handle',
      description: 'Bluesky username to monitor (e.g., username.bsky.social or @username.bsky.social)',
      required: true
    }),
    includeReplies: Property.Checkbox({
      displayName: 'Include Replies',
      description: 'Include reply posts by this author',
      required: false,
      defaultValue: false
    }),
    includeReposts: Property.Checkbox({
      displayName: 'Include Reposts',
      description: 'Include posts that this author reposted',
      required: false,
      defaultValue: false
    })
  },
  sampleData: {
    // Core post information
    uri: 'at://did:plc:example123/app.bsky.feed.post/example456',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    author: {
      did: 'did:plc:example123',
      handle: 'author.bsky.social',
      displayName: 'Example Author',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
      followersCount: 1500,
      followsCount: 300,
      postsCount: 250,
      viewer: {
        muted: false,
        blockedBy: false,
        following: 'at://following-record-uri'
      }
    },
    record: {
      $type: 'app.bsky.feed.post',
      createdAt: '2024-01-01T12:00:00.000Z',
      text: 'Just posted something new! Excited to share this with everyone.',
      langs: ['en']
    },
    indexedAt: '2024-01-01T12:00:00.000Z',
    
    // Engagement metrics
    replyCount: 3,
    repostCount: 8,
    likeCount: 25,
    quoteCount: 2,
    
    // Additional metadata
    labels: [],
    viewer: {
      repost: null,
      like: null
    },
    embed: null,
    
    // Post context
    postContext: {
      authorHandle: 'author.bsky.social',
      isReply: false,
      isRepost: false,
      replyTo: null,
      hasImages: false,
      hasVideo: false,
      hasExternalLink: false
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