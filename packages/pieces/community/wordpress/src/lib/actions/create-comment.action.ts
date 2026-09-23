import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { commentEditOutputSchema } from '../output-schemas';

export const createCommentAction = createAction({
  auth: wordpressAuth,
  name: 'create_comment',
  classification: 'WRITE',
  displayName: 'Create Comment',
  description: 'Adds a comment, or a reply to a comment, on a published post or page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a comment as the connected WordPress user on a published post or page, or replies to an existing comment. Fails if the post is not published or its comments are closed. Each call adds a new comment, so retries duplicate (WordPress rejects an exact duplicate).',
    idempotent: false,
  },
  outputSchema: commentEditOutputSchema,
  props: {
    post: Property.Number({
      displayName: 'Post ID',
      description: 'ID of a published post or page with comments open, from list_posts or list_pages.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Comment',
      description: 'Comment text. Basic HTML is allowed.',
      required: true,
    }),
    parent: Property.Number({
      displayName: 'Reply To Comment ID',
      description: 'ID of the comment to reply to, from list_comments. Leave empty for a top-level comment.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      post: wordpressContent.requireWholeNumber({ value: propsValue.post, propName: 'Post ID' }),
      content: propsValue.content,
    };
    if (wordpressContent.isSetNumber(propsValue.parent)) {
      body['parent'] = wordpressContent.requireWholeNumber({
        value: propsValue.parent,
        propName: 'Reply To Comment ID',
      });
    }
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.POST,
      path: '/comments',
      body,
    });
    return response.body;
  },
});
