import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { LetmepostApiError, letmepostClient } from '../common/client';
import { getPostOutputSchema } from '../common/output-schemas';

export const getPost = createAction({
  auth: letmepostAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get a Post',
  description: 'Retrieve a single post and its publish attempts',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one per-account post by its letmepost post id, including status, scheduled and published times, the account it went to, the platform URI and every publish attempt. Use results[].postId (or postIds) from Publish or Schedule a Post or an id from List Posts; the batch id returned at the top level of a publish is not fetchable and returns 404. Idempotent, a read-only lookup.',
    idempotent: true,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description:
        'The letmepost post id: a Post IDs entry from Publish a Post (or Publish or Schedule a Post), or an id from List Posts. The batch id of a publish does not work here.',
      required: true,
    }),
  },
  outputSchema: getPostOutputSchema,
  async run(context) {
    const postId = letmepostClient.uuidOf({ value: context.propsValue.postId, label: 'Post ID' });
    try {
      return await letmepostClient.request<unknown>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: `/v1/posts/${encodeURIComponent(postId)}`,
        operation: 'get the post',
      });
    } catch (error) {
      if (error instanceof LetmepostApiError && error.status === 404) {
        throw new LetmepostApiError(
          `${error.message} If this is the batch id from a publish, use results[].postId or postIds instead.`,
          error.status,
          error.responseBody
        );
      }
      throw error;
    }
  },
});
