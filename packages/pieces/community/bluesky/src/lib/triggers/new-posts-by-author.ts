import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { blueskyAuth, BlueSkyAuthType } from '../common/auth';
import { createBlueskyAgent } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof blueskyAuth>, { 
  authorSelection: string;
  authorFromFollowing?: string;
  authorHandle?: string;
  includeReplies?: boolean;
  includeReposts?: boolean;
}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { authorSelection, authorFromFollowing, authorHandle, includeReplies = false, includeReposts = false } = propsValue;
    
    let selectedAuthorHandle: string;
    if (authorSelection === 'following') {
      if (!authorFromFollowing) {
        return [];
      }
      selectedAuthorHandle = authorFromFollowing;
    } else if (authorSelection === 'manual') {
      if (!authorHandle) {
        return [];
      }
      selectedAuthorHandle = authorHandle;
    } else {
      return [];
    }
    
    try {
      if (!selectedAuthorHandle || selectedAuthorHandle.trim().length === 0) {
        return [];
      }

      const agent = await createBlueskyAgent(auth);
      
      const normalizedHandle = selectedAuthorHandle.replace('@', '').trim();
      
      const response = await agent.getAuthorFeed({
        actor: normalizedHandle,
        limit: 50,
        filter: 'posts_with_replies'
      });

      if (!response.data?.feed || !Array.isArray(response.data.feed)) {
        return [];
      }

      const cutoffTime = lastFetchEpochMS || 0;

      return response.data.feed
        .filter((feedItem: any) => {
          const post = feedItem.post;
          if (!post || !post.indexedAt) return false;
          
          const postTime = dayjs(post.indexedAt).valueOf();
          if (postTime <= cutoffTime) return false;

          const isReply = post.record?.reply !== undefined;
          const isRepost = feedItem.reason?.$type === 'app.bsky.feed.defs#reasonRepost';
          
          if (isReply && !includeReplies) return false;
          if (isRepost && !includeReposts) return false;
          
          return post.author.handle === normalizedHandle || post.author.did === normalizedHandle;
        })
        .map((feedItem: any) => {
          const post = feedItem.post;
          return {
            epochMilliSeconds: dayjs(post.indexedAt).valueOf(),
            data: {
              uri: post.uri,
              cid: post.cid,
              author: post.author,
              record: post.record,
              indexedAt: post.indexedAt,
              
              replyCount: post.replyCount || 0,
              repostCount: post.repostCount || 0,
              likeCount: post.likeCount || 0,
              quoteCount: post.quoteCount || 0,
              
              labels: post.labels || [],
              viewer: post.viewer || {},
              embed: post.embed || null,
              
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
        .sort((a: any, b: any) => b.epochMilliSeconds - a.epochMilliSeconds);

    } catch (error) {
      console.warn('Failed to fetch author posts:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }
};

export const newPostsByAuthor = createTrigger({
  auth: blueskyAuth,
  name: 'newPostsByAuthor',
  displayName: 'New Posts by Author',
  description: 'Triggers when a selected author creates a new post',
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
    
    authorFromFollowing: Property.Dropdown({
      displayName: 'Select Author',
      description: 'Choose from accounts you follow',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        try {
          const agent = await createBlueskyAgent(auth as BlueSkyAuthType);
          const session = agent.session;
          
          if (!session?.did) {
            return { options: [{ label: 'Please authenticate first', value: '' }] };
          }
          
          const followingResponse = await agent.getFollows({ 
            actor: session.did, 
            limit: 100 
          });
          
          return {
            options: followingResponse.data.follows.map(follow => ({
              label: `${follow.displayName || follow.handle} (@${follow.handle})`,
              value: follow.handle
            }))
          };
        } catch (error) {
          return { 
            options: [{ label: 'Error loading following list', value: '' }] 
          };
        }
      }
    }),
    
    authorHandle: Property.ShortText({
      displayName: 'Author Handle',
      description: 'Enter the Bluesky username (e.g., username.bsky.social)',
      required: false
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
    
    replyCount: 3,
    repostCount: 8,
    likeCount: 25,
    quoteCount: 2,
    
    labels: [],
    viewer: {
      repost: null,
      like: null
    },
    embed: null,
    
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