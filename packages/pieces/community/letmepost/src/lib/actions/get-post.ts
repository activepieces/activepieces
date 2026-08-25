import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostApiCall } from '../common';

export const getPost = createAction({
  auth: letmepostAuth,
  name: 'get_post',
  displayName: 'Get a Post',
  description: 'Retrieve a single post and its per-target results',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one post by id, including its status, scheduled and published times, the connected account it went to, and the resulting platform URL. Use to check whether a post published or to read back its details. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the post to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    const { postId } = context.propsValue;

    const response = await letmepostApiCall<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/v1/posts/${encodeURIComponent(postId)}`,
    });

    return response.body;
  },
});
