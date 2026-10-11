import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wordpressAuth } from '../..';
import { wordpressApi, WordpressRecord } from '../common/client';
import { wordpressContent } from '../common/content-body';
import { getPostByIdOutputSchema } from '../output-schemas';

export const getPostByIdAction = createAction({
  auth: wordpressAuth,
  name: 'get_post_by_id',
  classification: 'READ',
  displayName: 'Get Post by ID',
  description: 'Gets one blog post by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one WordPress blog post by ID, including drafts and private posts the connected user can edit. Get the ID from list_posts or search_site_content; use get_page for pages. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getPostByIdOutputSchema,
  props: {
    post_id: Property.Number({
      displayName: 'Post ID',
      description: 'ID of the post, from list_posts or search_site_content.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const postId = wordpressContent.requireWholeNumber({ value: propsValue.post_id, propName: 'Post ID' });
    const response = await wordpressApi.request<WordpressRecord>({
      auth,
      method: HttpMethod.GET,
      path: `/posts/${postId}`,
    });
    return response.body;
  },
});
