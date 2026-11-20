import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

export const getPost = createAction({
  auth: feedjoltAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get Post',
  description: 'Get a single feedback post by id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Get one feedback post by id in a workspace. Use when you already know which post to read. Prefer List Posts to browse. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceSlug: feedjoltCommon.workspaceDropdown,
    postId: feedjoltCommon.postDropdown,
  },
  async run(context) {
    const response = await feedjoltCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspaces/${encodeURIComponent(context.propsValue.workspaceSlug)}/posts/${encodeURIComponent(context.propsValue.postId)}`,
    });
    if (!feedjoltCommon.isRecord(response.body)) {
      throw new Error('Feedjolt returned an unexpected post payload.');
    }
    return feedjoltCommon.flattenPost(response.body);
  },
});
