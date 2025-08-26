import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { blueskyAuth } from '../common/auth';
import { createBlueskyAgent } from '../common/client';
import { simpleLanguageDropdown } from '../common/props';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof blueskyAuth>, { 
  searchQuery: string; 
  searchLanguage?: string;
  includeImages?: boolean;
  includeVideos?: boolean;
  sortBy?: string;
}> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { searchQuery, searchLanguage, includeImages, includeVideos, sortBy } = propsValue;
    
    try {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return [];
      }

      const agent = await createBlueskyAgent(auth);

      const searchParams: any = {
        q: searchQuery.trim(),
        limit: 50,
        sort: sortBy || 'latest'
      };

      if (searchLanguage && searchLanguage !== 'other') {
        searchParams.lang = searchLanguage;
      }

      const response = await agent.api.app.bsky.feed.searchPosts(searchParams);

      if (!response.data?.posts || !Array.isArray(response.data.posts)) {
        return [];
      }

      const cutoffTime = lastFetchEpochMS || 0;

      return response.data.posts
        .filter((post: any) => {
          if (!post.indexedAt) return false;
          
          const postTime = dayjs(post.indexedAt).valueOf();
          if (postTime <= cutoffTime) return false;

          if (includeImages === false && post.embed?.images) return false;
          if (includeVideos === false && post.embed?.video) return false;
          if (includeImages === true && !post.embed?.images) return false;
          if (includeVideos === true && !post.embed?.video) return false;

          return true;
        })
        .map((post: any) => ({
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
            
            searchContext: {
              query: searchQuery,
              language: searchLanguage || null,
              matchedTerms: extractMatchedTerms(post.record?.text || '', searchQuery),
              hasImages: !!(post.embed?.images),
              hasVideo: !!(post.embed?.video),
              hasExternalLink: !!(post.embed?.external)
            }
          }
        }))
        .sort((a: any, b: any) => b.epochMilliSeconds - a.epochMilliSeconds);

    } catch (error) {
      console.warn('Failed to search posts:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }
};

function extractMatchedTerms(text: string, query: string): string[] {
  if (!text || !query) return [];
  
  const cleanQuery = query.toLowerCase()
    .replace(/["']/g, '')
    .replace(/\s+(or|and)\s+/gi, ' ');
  
  const terms = cleanQuery.split(/\s+/).filter(term => term.length > 0 && !['or', 'and'].includes(term.toLowerCase()));
  const matchedTerms: string[] = [];
  const lowerText = text.toLowerCase();
  
  terms.forEach(term => {
    if (term.startsWith('#') || term.startsWith('@')) {
      if (lowerText.includes(term)) {
        matchedTerms.push(term);
      }
    } else if (lowerText.includes(term)) {
      matchedTerms.push(term);
    }
  });
  
  return [...new Set(matchedTerms)];
}

export const newPost = createTrigger({
  auth: blueskyAuth,
  name: 'newPost',
  displayName: 'New Post (with Search Options)',
  description: 'Triggers when posts match your search criteria',
  props: {
    searchQuery: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords, hashtags (#example), or mentions (@handle) to find',
      required: true
    }),
    searchLanguage: {
      ...simpleLanguageDropdown,
      displayName: 'Language Filter',
      description: 'Filter by language',
      required: false
    },
    includeImages: Property.Checkbox({
      displayName: 'Filter by Images',
      description: 'Only posts with/without images',
      required: false,
      defaultValue: undefined
    }),
    includeVideos: Property.Checkbox({
      displayName: 'Filter by Videos',
      description: 'Only posts with/without videos',
      required: false,
      defaultValue: undefined
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'How to sort results',
      required: false,
      defaultValue: 'latest',
      options: {
        options: [
          { label: 'Latest First', value: 'latest' },
          { label: 'Most Popular', value: 'top' }
        ]
      }
    })
  },
  sampleData: {
    uri: 'at://did:plc:example123/app.bsky.feed.post/example456',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    author: {
      did: 'did:plc:example123',
      handle: 'searchauthor.bsky.social',
      displayName: 'Search Result Author',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
      viewer: {
        muted: false,
        blockedBy: false
      }
    },
    record: {
      $type: 'app.bsky.feed.post',
      createdAt: '2024-01-01T12:00:00.000Z',
      text: 'This post matches your search criteria! #automation #activepieces',
      langs: ['en']
    },
    indexedAt: '2024-01-01T12:00:00.000Z',
    
    replyCount: 2,
    repostCount: 5,
    likeCount: 12,
    quoteCount: 1,
    
    labels: [],
    viewer: {
      repost: null,
      like: null
    },
    embed: null,
    
    searchContext: {
      query: 'automation',
      language: 'en',
      matchedTerms: ['automation'],
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