import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditGetContentOutputSchema } from '../../output-schemas';

export const redditGetContent = createAction({
  auth: redditAuth,
  name: 'reddit_get_content',
  outputSchema: redditGetContentOutputSchema,
  displayName: 'Get Posts or Comments by ID',
  description: 'Gets one or more posts, comments or subreddits by their Reddit fullname.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches posts (t3_), comments (t1_) or subreddits (t5_) by fullname, up to 100 at once, without the surrounding thread. Ids must carry their type prefix; the `name` field of any listed item is its fullname. Use List Post Comments to read a whole discussion.',
    idempotent: true,
  },
  props: {
    ids: Property.ShortText({
      displayName: 'Fullnames',
      description: 'Comma-separated fullnames, e.g. "t3_abc123,t1_def456".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = propsValue.ids
      .split(',')
      .filter((id) => id.trim() !== '')
      .map((id) => redditApi.requireFullname({ value: id, label: 'Each id' }));
    if (ids.length === 0 || ids.length > 100) {
      throw new Error('Provide between 1 and 100 fullnames.');
    }
    const listing = await redditApi.request<RedditListing>({
      auth,
      method: HttpMethod.GET,
      path: '/api/info',
      query: { id: ids.join(',') },
    });
    const { items, count } = redditApi.toListing({ listing });
    return { items, count };
  },
});
