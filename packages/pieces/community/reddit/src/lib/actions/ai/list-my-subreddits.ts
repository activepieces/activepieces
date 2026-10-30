import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListMySubredditsOutputSchema } from '../../output-schemas';

export const redditListMySubreddits = createAction({
  auth: redditAuth,
  name: 'reddit_list_my_subreddits',
  outputSchema: redditListMySubredditsOutputSchema,
  displayName: 'List My Subreddits',
  description: 'Lists the subreddits you subscribe to, moderate or contribute to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists subreddits tied to your account: the ones you joined (subscriber), moderate, or are an approved contributor in. Pages with the returned `after` cursor. Needs the `mysubreddits` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    where: Property.StaticDropdown({
      displayName: 'Relationship',
      description: 'Which subreddits to list (default subscriber).',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'subscriber' },
          { label: 'Moderated', value: 'moderator' },
          { label: 'Approved Contributor', value: 'contributor' },
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
      path: `/subreddits/mine/${propsValue.where ?? 'subscriber'}`,
      query: { limit: redditAiProps.clampLimit({ value: propsValue.limit }), after: propsValue.after },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { subreddits: items, ...page };
  },
});
