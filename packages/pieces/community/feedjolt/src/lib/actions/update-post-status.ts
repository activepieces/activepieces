import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

export const updatePostStatus = createAction({
  auth: feedjoltAuth,
  name: 'update_post_status',
  classification: 'WRITE',
  displayName: 'Update Post Status',
  description: 'Change the status of a feedback post.',
  audience: 'both',
  aiMetadata: {
    description:
      'Set a post to a specific workspace status by id. Use after listing statuses or when moving a post along the board. Safe to retry with the same status.',
    idempotent: true,
  },
  props: {
    workspaceSlug: feedjoltCommon.workspaceDropdown,
    postId: feedjoltCommon.postDropdown,
    statusId: feedjoltCommon.statusDropdown,
  },
  async run(context) {
    const response = await feedjoltCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/workspaces/${encodeURIComponent(context.propsValue.workspaceSlug)}/posts/${encodeURIComponent(context.propsValue.postId)}/status`,
      body: {
        status_id: context.propsValue.statusId,
      },
    });
    if (!feedjoltCommon.isRecord(response.body)) {
      throw new Error('Feedjolt returned an unexpected status-update payload.');
    }
    return feedjoltCommon.flattenPost(response.body);
  },
});
