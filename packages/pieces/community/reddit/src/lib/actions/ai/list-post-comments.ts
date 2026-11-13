import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditListing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListPostCommentsOutputSchema } from '../../output-schemas';

export const redditListPostComments = createAction({
  auth: redditAuth,
  name: 'reddit_list_post_comments',
  outputSchema: redditListPostCommentsOutputSchema,
  displayName: 'List Post Comments',
  description: 'Gets a post and its comment thread, flattened with depth and parent ids.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a post and its comments as a flat list, each with `depth` and `parent_id` to rebuild the thread. Large threads are truncated: `more` lists placeholders whose `children` ids can be loaded with Expand More Comments. Accepts the post id with or without t3_. Pass Comment ID to focus on one comment\'s subthread.',
    idempotent: true,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Post id, e.g. "abc123" or "t3_abc123".', required: true }),
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
    comment_id: Property.ShortText({ displayName: 'Comment ID', description: 'Only return this comment and its replies (id without t1_).', required: false }),
    depth: Property.Number({ displayName: 'Depth', description: 'Maximum reply depth to include.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum number of comments to load.', required: false }),
  },
  async run({ auth, propsValue }) {
    const [postListing, commentListing] = await redditApi.request<[RedditListing, RedditListing]>({
      auth,
      method: HttpMethod.GET,
      path: `/comments/${redditApi.toBaseId({ value: propsValue.post_id })}`,
      query: {
        sort: propsValue.sort,
        comment: propsValue.comment_id ? redditApi.toBaseId({ value: propsValue.comment_id }) : undefined,
        depth: propsValue.depth,
        limit: redditAiProps.clampLimit({ value: propsValue.limit }),
      },
    });
    const post = postListing.data.children[0];
    const { comments, more } = redditApi.flattenCommentTree({ children: commentListing.data.children });
    return { post: post ? redditApi.toThing({ thing: post }) : null, comments, count: comments.length, more };
  },
});
