import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import type { AppBskyFeedDefs, AtpAgent } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { newPostTriggerOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyMappers } from '../common/mappers';
import { blueskyPolling, PageFetcher } from '../common/polling';

const STORE_KEY = 'bluesky_search_poll';

export const newPost = createTrigger({
  auth: blueskyAuth,
  name: 'newPost',
  classification: 'READ',
  displayName: 'New Post (with Search Options)',
  description: 'Triggers when posts match your search criteria',
  aiMetadata: {
    description:
      'Fires when a new public Bluesky post matches a configured search query (keywords, hashtags, or mentions), with optional language filter and "only with images/videos" filters; each event represents one newly indexed matching post. With Most Popular sorting only the first page of top results is checked.',
  },
  props: {
    searchQuery: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords, hashtags (#example), or mentions (@handle) to find',
      required: true,
    }),
    searchLanguage: {
      ...blueskyProps.simpleLanguageDropdown,
      displayName: 'Language Filter',
      description: 'Filter by language',
      required: false,
    },
    includeImages: Property.Checkbox({
      displayName: 'Filter by Images',
      description: 'When ticked, only posts with images trigger the flow',
      required: false,
      defaultValue: undefined,
    }),
    includeVideos: Property.Checkbox({
      displayName: 'Filter by Videos',
      description: 'When ticked, only posts with a video trigger the flow',
      required: false,
      defaultValue: undefined,
    }),
    sortBy: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'How to sort results',
      required: false,
      defaultValue: 'latest',
      options: {
        options: [
          { label: 'Latest First', value: 'latest' },
          { label: 'Most Popular', value: 'top' },
        ],
      },
    }),
  },
  sampleData: {
    uri: 'at://did:plc:example123/app.bsky.feed.post/example456',
    cid: 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe',
    url: 'https://bsky.app/profile/searchauthor.bsky.social/post/example456',
    author: {
      did: 'did:plc:example123',
      handle: 'searchauthor.bsky.social',
      displayName: 'Search Result Author',
      avatar: 'https://cdn.bsky.app/img/avatar/plain/did:plc:example123/example@jpeg',
      viewer: { muted: false, blockedBy: false },
    },
    record: {
      $type: 'app.bsky.feed.post',
      createdAt: '2024-01-01T12:00:00.000Z',
      text: 'This post matches your search criteria! #automation #activepieces',
      langs: ['en'],
    },
    indexedAt: '2024-01-01T12:00:00.000Z',
    replyCount: 2,
    repostCount: 5,
    likeCount: 12,
    quoteCount: 1,
    labels: [],
    viewer: { repost: null, like: null },
    embed: null,
    searchContext: {
      query: 'automation',
      language: 'en',
      matchedTerms: ['automation'],
      hasImages: false,
      hasVideo: false,
      hasExternalLink: false,
    },
  },
  type: TriggerStrategy.POLLING,
  outputSchema: newPostTriggerOutputSchema,
  async test(context) {
    const config = searchConfig(context.propsValue);
    if (config === null) {
      return [];
    }
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'search posts',
      fn: (agent) => blueskyPolling.sample({ fetchPage: searchPage({ agent, config }) }),
    });
  },
  async onEnable(context) {
    const config = searchConfig(context.propsValue);
    if (config === null) {
      return;
    }
    await blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'search posts',
      fn: (agent) =>
        blueskyPolling.onEnable({ store: context.store, storeKey: STORE_KEY, fetchPage: searchPage({ agent, config }), isRepublish: context.isRepublish }),
    });
  },
  async onDisable(context) {
    await blueskyPolling.onDisable({ store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const config = searchConfig(context.propsValue);
    if (config === null) {
      return [];
    }
    return blueskyClient.withBluesky({
      auth: context.auth.props,
      action: 'search posts',
      fn: (agent) =>
        blueskyPolling.poll({
          store: context.store,
          storeKey: STORE_KEY,
          fetchPage: searchPage({ agent, config }),
          maxPages: config.sort === 'top' ? 1 : blueskyPolling.MAX_PAGES,
          resumable: config.sort !== 'top',
        }),
    });
  },
});

function searchConfig(props: {
  searchQuery: string;
  searchLanguage?: string;
  includeImages?: boolean;
  includeVideos?: boolean;
  sortBy?: string;
}): SearchConfig | null {
  const query = (props.searchQuery ?? '').trim();
  if (query === '') {
    return null;
  }
  return {
    query,
    lang: props.searchLanguage && props.searchLanguage !== 'other' ? props.searchLanguage : undefined,
    language: props.searchLanguage || null,
    onlyImages: props.includeImages === true,
    onlyVideos: props.includeVideos === true,
    sort: props.sortBy === 'top' ? 'top' : 'latest',
  };
}

function searchPage({ agent, config }: { agent: AtpAgent; config: SearchConfig }): PageFetcher<ReturnType<typeof searchItem>> {
  return async ({ cursor }) => {
    const response = await agent.app.bsky.feed.searchPosts({
      q: config.query,
      limit: 100,
      sort: config.sort,
      cursor,
      ...(config.lang ? { lang: config.lang } : {}),
    });
    const times = response.data.posts.map((post) => blueskyPolling.timeOf(post.indexedAt));
    const items = response.data.posts
      .filter((post) => {
        const flags = blueskyMappers.mediaFlags(post.embed);
        return (!config.onlyImages || flags.hasImages) && (!config.onlyVideos || flags.hasVideo);
      })
      .map((post) => ({ key: post.uri, time: blueskyPolling.timeOf(post.indexedAt) ?? 0, data: searchItem({ post, config }) }));
    return { items, cursor: response.data.cursor, ...blueskyPolling.pageTimes(times) };
  };
}

function searchItem({ post, config }: { post: AppBskyFeedDefs.PostView; config: SearchConfig }) {
  return {
    ...blueskyMappers.postBase(post),
    searchContext: {
      query: config.query,
      language: config.language,
      matchedTerms: extractMatchedTerms({ text: blueskyMappers.recordText(post.record), query: config.query }),
      ...blueskyMappers.mediaFlags(post.embed),
    },
  };
}

function extractMatchedTerms({ text, query }: { text: string; query: string }): string[] {
  if (!text || !query) {
    return [];
  }
  const terms = query
    .toLowerCase()
    .replace(/["']/g, '')
    .split(/\s+/)
    .filter((term) => term.length > 0 && term !== 'or' && term !== 'and');
  const lowerText = text.toLowerCase();
  return [...new Set(terms.filter((term) => lowerText.includes(term)))];
}

type SearchConfig = {
  query: string;
  lang: string | undefined;
  language: string | null;
  onlyImages: boolean;
  onlyVideos: boolean;
  sort: 'top' | 'latest';
};
