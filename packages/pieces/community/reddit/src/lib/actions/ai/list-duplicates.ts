import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListDuplicatesOutputSchema } from '../../output-schemas';

export const redditListDuplicates = createAction({
  auth: redditAuth,
  name: 'reddit_list_duplicates',
  outputSchema: redditListDuplicatesOutputSchema,
  displayName: 'List Duplicates and Crossposts',
  description: 'Lists other submissions of the same link, including crossposts of a post.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists where else a post was shared: other submissions of the same link and crossposts of it. Set Crossposts Only to Yes for crossposts alone. Pages with the returned `after` cursor.',
    idempotent: true,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Post id, e.g. "abc123" or "t3_abc123".', required: true }),
    crossposts_only: redditAiProps.optionalBoolean({ displayName: 'Crossposts Only', description: 'Only return crossposts of this post.' }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort order (default most comments).',
      required: false,
      options: {
        options: [
          { label: 'Most Comments', value: 'num_comments' },
          { label: 'New', value: 'new' },
        ],
      },
    }),
    limit: redditAiProps.limit(),
    after: redditAiProps.after(),
  },
  async run({ auth, propsValue }) {
    const [postListing, duplicatesListing] = await redditApi.request<[RedditListing, RedditListing]>({
      auth,
      method: HttpMethod.GET,
      path: `/duplicates/${redditApi.toBaseId({ value: propsValue.post_id })}`,
      query: {
        crossposts_only: propsValue.crossposts_only,
        sort: propsValue.sort,
        limit: redditAiProps.clampLimit({ value: propsValue.limit }),
        after: propsValue.after,
      },
    });
    const post = postListing.data.children[0];
    const { items, ...page } = redditApi.toListing({ listing: duplicatesListing });
    return { post: post ? redditApi.toThing({ thing: post }) : null, duplicates: items, ...page };
  },
});
