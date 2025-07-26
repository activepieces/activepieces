
import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { blueskyAuth } from '../common/auth';
import { makeBlueskyRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
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

      // Prepare search parameters
      const searchParams: any = {
        q: searchQuery.trim(),
        limit: 50, // Get recent posts
        sort: sortBy || 'latest' // Sort by latest by default
      };

      // Add language filter if specified
      if (searchLanguage && searchLanguage !== 'other') {
        searchParams.lang = searchLanguage;
      }

      // Search for posts using app.bsky.feed.searchPosts
      const response = await makeBlueskyRequest(
        auth,
        HttpMethod.GET,
        'app.bsky.feed.searchPosts',
        undefined,
        searchParams,
        false // This is a public endpoint
      );

      if (!response.posts || !Array.isArray(response.posts)) {
        return [];
      }

      // Filter posts since last fetch
      const cutoffTime = lastFetchEpochMS || 0;

      return response.posts
        .filter((post: any) => {
          if (!post.indexedAt) return false;
          
          const postTime = dayjs(post.indexedAt).valueOf();
          if (postTime <= cutoffTime) return false;

          // Apply media filters if specified
          if (includeImages === false && post.embed?.images) return false;
          if (includeVideos === false && post.embed?.video) return false;
          if (includeImages === true && !post.embed?.images) return false;
          if (includeVideos === true && !post.embed?.video) return false;

          return true;
        })
        .map((post: any) => ({
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
            
            // Search context
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
        .sort((a: any, b: any) => b.epochMilliSeconds - a.epochMilliSeconds); // Most recent first

    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }
};

// Helper function to extract matched terms from post text
function extractMatchedTerms(text: string, query: string): string[] {
  if (!text || !query) return [];
  
  const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  const matchedTerms: string[] = [];
  const lowerText = text.toLowerCase();
  
  terms.forEach(term => {
    if (lowerText.includes(term)) {
      matchedTerms.push(term);
    }
  });
  
  return [...new Set(matchedTerms)]; // Remove duplicates
}

export const newPost = createTrigger({
  auth: blueskyAuth,
  name: 'newPost',
  displayName: 'New Post (with Search Options)',
  description: 'Triggers when a new post matches given search criteria (mentions, hashtags, keywords)',
  props: {
    searchQuery: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search for posts containing specific keywords, hashtags (#example), mentions (@handle), or phrases. Use quotes for exact phrases. Example: activepieces OR #automation OR @myhandle',
      required: true
    }),
    searchLanguage: {
      ...simpleLanguageDropdown,
      displayName: 'Language Filter',
      description: 'Only find posts in a specific language (optional)',
      required: false
    },
    includeImages: Property.Checkbox({
      displayName: 'Filter by Images',
      description: 'Filter posts based on image content',
      required: false,
      defaultValue: undefined
    }),
    includeVideos: Property.Checkbox({
      displayName: 'Filter by Videos',
      description: 'Filter posts based on video content',
      required: false,
      defaultValue: undefined
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'How to sort the search results',
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
    // Core post information
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
    
    // Engagement metrics
    replyCount: 2,
    repostCount: 5,
    likeCount: 12,
    quoteCount: 1,
    
    // Additional metadata
    labels: [],
    viewer: {
      repost: null,
      like: null
    },
    embed: null,
    
    // Search context
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