import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

export const getPostAction = createAction({
  auth: feedhiveAuth,
  name: 'get_post',
  displayName: 'Get Post',
  description: 'Retrieves the details of a specific post.',
  props: {
    post_id: feedhiveCommon.postDropdown,
  },
  async run(context) {
    const response = await feedhiveCommon.apiCall<{ data: Record<string, unknown> }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: `/posts/${context.propsValue.post_id}`,
    });

    return feedhiveCommon.flattenPost(response.body.data);
  },
});
