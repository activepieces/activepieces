import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { postEditOutputSchema } from '../output-schemas';

export const updateBlogPostAction = createAction({
  auth: wordpressAuth,
  name: 'update_blog_post',
  classification: 'WRITE',
  displayName: 'Update Blog Post',
  description: 'Changes only the fields you supply on an existing blog post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing WordPress blog post by ID, sending only the fields you supply; everything else stays as it is. Category IDs and Tag IDs replace the current set. Also sets comments or pingbacks open or closed, and writes only the custom ACF fields you supply. To trash a post use trash_post. Safe to retry with the same input.',
    idempotent: true,
  },
  outputSchema: postEditOutputSchema,
  props: {
    post_id: Property.Number({
      displayName: 'Post ID',
      description: 'ID of the post to update, from list_posts.',
      required: true,
    }),
    ...wordpressContent.contentProps({ kind: 'post', mode: 'update' }),
    ...wordpressContent.postOnlyProps({ mode: 'update' }),
  },
  async run({ auth, propsValue }) {
    const postId = wordpressContent.requireWholeNumber({ value: propsValue.post_id, propName: 'Post ID' });
    const body = wordpressContent.buildContentBody({ kind: 'post', values: propsValue });
    wordpressContent.requirePatch({ body });
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.POST,
      path: `/posts/${postId}`,
      body,
    });
    return response.body;
  },
});
