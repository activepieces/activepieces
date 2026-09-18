import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const getPostAction = createAction({
  auth: markyAuth,
  name: 'get_post',
  displayName: 'Get Post',
  description: 'Retrieve a single post, including its per-platform publish results.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read one Marky post by id, with the per-platform publish results that say whether it went live and where. Use it to poll after publishing until every platform result reaches success or failed. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    businessId: markyProps.businessId,
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the post to retrieve, as returned by Create Post or List Posts.',
      required: true,
    }),
  },
  async run(context) {
    const { businessId, postId } = context.propsValue;

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/businesses/${businessId}/posts/${postId}`,
    });

    return response.body;
  },
});
