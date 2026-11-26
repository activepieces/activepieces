import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { supabirdAuth } from '../auth';
import { supabirdRequest } from '../common/client';

export const getPostAction = createAction({
  auth: supabirdAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get Post',
  description:
    'Get a post by its ID, including its public URL on each network once it is published.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one SupaBird post by id: its text, status, schedule time and the public URL on every network (urls, published_urls, waiting_for_url). Use it to find the link of a post after it publishes. Safe to retry.',
    idempotent: true,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description:
        'The ID of the post, for example 6afe0717f47f2d00029cd71e. Use the ID returned by Create Post or by one of the SupaBird triggers.',
      required: true,
    }),
  },
  async run(context) {
    const { body } = await supabirdRequest({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/posts/${encodeURIComponent(context.propsValue.postId.trim())}`,
    });
    return body;
  },
});
