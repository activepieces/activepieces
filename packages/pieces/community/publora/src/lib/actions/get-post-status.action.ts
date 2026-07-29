import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { publoraAuth } from '../auth';
import { publoraApiCall, PubloraPost } from '../common/client';

export const getPostStatusAction = createAction({
  auth: publoraAuth,
  name: 'get_post_status',
  displayName: 'Get Post Status',
  description:
    'Retrieve a post and its per-platform delivery status: scheduled, published or failed.',
  props: {
    postGroupId: Property.ShortText({
      displayName: 'Post Group ID',
      description: 'Returned by Create Post.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await publoraApiCall<PubloraPost>({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: `/get-post/${propsValue.postGroupId}`,
    });
  },
});
