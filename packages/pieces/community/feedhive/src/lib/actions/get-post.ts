import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../common/auth';
import { feedhiveCommon } from '../common';

export const getPostAction = createAction({
  auth: feedhiveAuth,
  name: 'get_post',
  displayName: 'Get Post',
  description: 'Retrieves the details of a specific post.',
  audience: 'both',
  aiMetadata: { description: 'Fetches the full details of a single FeedHive post by its post ID. Use to read a post\'s current content, status, schedule, accounts, and labels before acting on it. Read-only and idempotent.', idempotent: true },
  props: {
    post_id: feedhiveCommon.postDropdown,
  },
  async run(context) {
    const response = await feedhiveCommon.apiCall<{ data: Record<string, unknown> }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/posts/${context.propsValue.post_id}`,
    });

    return feedhiveCommon.flattenPost(response.body.data);
  },
});
