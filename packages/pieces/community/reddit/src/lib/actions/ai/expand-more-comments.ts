import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditThing } from '../../common/client';
import { redditExpandMoreCommentsOutputSchema } from '../../output-schemas';

export const redditExpandMoreComments = createAction({
  auth: redditAuth,
  name: 'reddit_expand_more_comments',
  outputSchema: redditExpandMoreCommentsOutputSchema,
  displayName: 'Expand More Comments',
  description: 'Loads comments hidden behind a "load more comments" placeholder.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Loads the comments behind a `more` placeholder returned by List Post Comments: pass the post id and the placeholder\'s `children` ids (up to 100). Returns the loaded comments flat, plus any further `more` placeholders.',
    idempotent: true,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Post id, e.g. "abc123" or "t3_abc123".', required: true }),
    children: Property.ShortText({ displayName: 'Comment IDs', description: 'Comma-separated ids from a `more` placeholder\'s `children`.', required: true }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Comment sort order (default best).',
      required: false,
      options: {
        options: [
          { label: 'Best', value: 'confidence' },
          { label: 'Top', value: 'top' },
          { label: 'New', value: 'new' },
          { label: 'Controversial', value: 'controversial' },
          { label: 'Old', value: 'old' },
          { label: 'Q&A', value: 'qa' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const children = propsValue.children
      .split(',')
      .map((id) => redditApi.toBaseId({ value: id }))
      .filter((id) => id !== '');
    if (children.length === 0 || children.length > 100) {
      throw new Error('Provide between 1 and 100 comment ids.');
    }
    const response = await redditApi.request<MoreChildrenResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/api/morechildren',
      query: {
        api_type: 'json',
        link_id: redditApi.toFullname({ value: propsValue.post_id, prefix: 't3_' }),
        children: children.join(','),
        sort: propsValue.sort,
      },
    });
    const things = response.json.data?.things ?? [];
    const comments = things.filter((thing) => thing.kind !== 'more').map((thing) => redditApi.toThing({ thing }));
    const more = things.filter((thing) => thing.kind === 'more').map((thing) => redditApi.toThing({ thing }));
    return { comments, count: comments.length, more };
  },
});

type MoreChildrenResponse = {
  json: { data?: { things?: RedditThing[] } };
};
