import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListSubredditsOutputSchema } from '../../output-schemas';

export const redditSearchSubreddits = createAction({
  auth: redditAuth,
  name: 'reddit_search_subreddits',
  outputSchema: redditListSubredditsOutputSchema,
  displayName: 'Search Subreddits',
  description: 'Searches subreddits by name, title and description.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds subreddits matching a topic or keyword in their name, title or description. Returns each subreddit\'s `display_name` (the value other actions take as Subreddit) and subscriber count. Pages with the returned `after` cursor.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Topic or keyword to search for.', required: true }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort order (default relevance).',
      required: false,
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Activity', value: 'activity' },
        ],
      },
    }),
    limit: redditAiProps.limit(),
    after: redditAiProps.after(),
  },
  async run({ auth, propsValue }) {
    const listing = await redditApi.request<RedditListing>({
      auth,
      method: HttpMethod.GET,
      path: '/subreddits/search',
      query: { q: propsValue.query, sort: propsValue.sort, limit: redditAiProps.clampLimit({ value: propsValue.limit }), after: propsValue.after },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { subreddits: items, ...page };
  },
});
