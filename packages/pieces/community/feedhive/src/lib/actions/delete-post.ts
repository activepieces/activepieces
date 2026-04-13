import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../../';
import { feedhiveCommon } from '../common';

export const deletePostAction = createAction({
  auth: feedhiveAuth,
  name: 'delete_post',
  displayName: 'Delete Post',
  description: 'Deletes a post from FeedHive. This action cannot be undone.',
  props: {
    post_id: feedhiveCommon.postDropdown,
  },
  async run(context) {
    await feedhiveCommon.apiCall({
      token: context.auth as unknown as string,
      method: HttpMethod.DELETE,
      path: `/posts/${context.propsValue.post_id}`,
    });

    return { success: true, deleted_post_id: context.propsValue.post_id };
  },
});
