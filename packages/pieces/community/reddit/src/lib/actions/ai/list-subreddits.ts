import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListSubredditsOutputSchema } from '../../output-schemas';

export const redditListSubreddits = createAction({
  auth: redditAuth,
  name: 'reddit_list_subreddits',
  outputSchema: redditListSubredditsOutputSchema,
  displayName: 'List Subreddits',
  description: 'Lists popular, new or default subreddits.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists subreddits Reddit-wide: the most popular, the newest, or the defaults. Use Search Subreddits to find by topic and List My Subreddits for the ones you joined. Pages with the returned `after` cursor.',
    idempotent: true,
  },
  props: {
    where: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Which subreddits to list (default popular).',
      required: false,
      options: {
        options: [
          { label: 'Popular', value: 'popular' },
          { label: 'New', value: 'new' },
          { label: 'Default', value: 'default' },
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
      path: `/subreddits/${propsValue.where ?? 'popular'}`,
      query: { limit: redditAiProps.clampLimit({ value: propsValue.limit }), after: propsValue.after },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { subreddits: items, ...page };
  },
});
