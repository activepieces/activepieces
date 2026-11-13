import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListUserContentOutputSchema } from '../../output-schemas';

export const redditListUserContent = createAction({
  auth: redditAuth,
  name: 'reddit_list_user_content',
  outputSchema: redditListUserContentOutputSchema,
  displayName: 'List User Content',
  description: 'Lists a user\'s posts and comments, or your own saved, upvoted or hidden items.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists a user\'s activity: everything (overview), posts (submitted) or comments, sorted. For your own account (username from Get My Account) it can also list saved, upvoted, downvoted, hidden and gilded items; those fail with 403 for other users. Items are posts (t3) or comments (t1). Pages with the returned `after` cursor.',
    idempotent: true,
  },
  props: {
    username: redditAiProps.username({}),
    where: Property.StaticDropdown({
      displayName: 'Content',
      description: 'What to list (default overview).',
      required: false,
      options: {
        options: [
          { label: 'Overview (posts and comments)', value: 'overview' },
          { label: 'Posts', value: 'submitted' },
          { label: 'Comments', value: 'comments' },
          { label: 'Saved (own account)', value: 'saved' },
          { label: 'Upvoted (own account)', value: 'upvoted' },
          { label: 'Downvoted (own account)', value: 'downvoted' },
          { label: 'Hidden (own account)', value: 'hidden' },
          { label: 'Gilded', value: 'gilded' },
        ],
      },
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort order (default new).',
      required: false,
      options: {
        options: [
          { label: 'New', value: 'new' },
          { label: 'Hot', value: 'hot' },
          { label: 'Top', value: 'top' },
          { label: 'Controversial', value: 'controversial' },
        ],
      },
    }),
    time: redditAiProps.timeFilter(),
    limit: redditAiProps.limit(),
    after: redditAiProps.after(),
  },
  async run({ auth, propsValue }) {
    const listing = await redditApi.request<RedditListing>({
      auth,
      method: HttpMethod.GET,
      path: `/user/${redditApi.cleanUsername({ value: propsValue.username })}/${propsValue.where ?? 'overview'}`,
      query: {
        sort: propsValue.sort,
        t: propsValue.time,
        limit: redditAiProps.clampLimit({ value: propsValue.limit }),
        after: propsValue.after,
      },
    });
    const { items, ...page } = redditApi.toListing({ listing });
    return { items, ...page };
  },
});
