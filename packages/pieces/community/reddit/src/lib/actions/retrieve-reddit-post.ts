import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi } from '../common/client';
import { retrieveRedditPostOutputSchema } from '../output-schemas';

export const retrieveRedditPost = createAction({
  auth: redditAuth,
  name: 'retrieveRedditPost',
  outputSchema: retrieveRedditPostOutputSchema,
  classification: 'SEARCH',
  displayName: 'Retrieve Post',
  description: 'Fetch top posts in a subreddit with optional size limit.',
  audience: 'human',
  aiMetadata: { description: 'Lists posts from a given subreddit, choosing the listing via a category (hot, new, top, rising, or controversial). Use it to read or monitor a subreddit\'s feed rather than to look up one known post. Requires the subreddit name; an optional size caps how many posts are returned (max 100). Read-only and idempotent.', idempotent: true },
  props: {
    post_category: Property.StaticDropdown({
      displayName: 'Post Category',
      description: 'Select the category of posts to retrieve',
      required: true,
      defaultValue: 'hot',
      options: {
        options: [
          { label: 'Hot', value: 'hot' },
          { label: 'New', value: 'new' },
          { label: 'Top', value: 'top' },
          { label: 'Rising', value: 'rising' },
          { label: 'Controversial', value: 'controversial' },
        ],
      },
    }),
    subreddit: Property.ShortText({
      displayName: 'Subreddit',
      description: 'The subreddit to fetch posts from',
      required: true,
    }),
    size: Property.Number({
      displayName: 'Number of Posts',
      description: 'Number of posts to fetch (max 100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    return redditApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/r/${context.propsValue.subreddit}/${context.propsValue.post_category}`,
      query: { limit: context.propsValue.size || 10 },
    });
  },
});
