import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditSearchUsersOutputSchema } from '../../output-schemas';

export const redditSearchUsers = createAction({
  auth: redditAuth,
  name: 'reddit_search_users',
  outputSchema: redditSearchUsersOutputSchema,
  displayName: 'Search Users',
  description: 'Searches Reddit users by name.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds Reddit accounts whose username or profile matches a query, returning each `name` (the Username for Get User and List User Content) with karma. Pages with the returned `after` cursor.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Name or keyword to search for.', required: true }),
    limit: redditAiProps.limit(),
    after: redditAiProps.after(),
  },
  async run({ auth, propsValue }) {
    const listing = await redditApi.request<RedditListing>({
      auth,
      method: HttpMethod.GET,
      path: '/users/search',
      query: { q: propsValue.query, limit: redditAiProps.clampLimit({ value: propsValue.limit }), after: propsValue.after },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { users: items, ...page };
  },
});
