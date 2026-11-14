import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

export const listPosts = createAction({
  auth: feedjoltAuth,
  name: 'list_posts',
  classification: 'SEARCH',
  displayName: 'List Posts',
  description: 'List feedback posts in a workspace, optionally filtered by board.',
  audience: 'both',
  aiMetadata: {
    description:
      'List feedback posts in a workspace, newest first. Optionally filter by board and limit (1–100, default 20). Use to browse posts before get or status update. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceSlug: feedjoltCommon.workspaceDropdown,
    boardId: feedjoltCommon.boardIdDropdown,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of posts to return (1–100). Defaults to 20.',
      required: false,
      defaultValue: 20,
      display: 'stepper',
      min: 1,
      max: 100,
      step: 1,
    }),
  },
  async run(context) {
    const pageSize = Math.min(100, Math.max(1, context.propsValue.limit ?? 20));
    const response = await feedjoltCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspaces/${encodeURIComponent(context.propsValue.workspaceSlug)}/posts`,
      queryParams: {
        page_size: pageSize,
        sort_by: 'newest',
        board_id: context.propsValue.boardId,
      },
    });
    return feedjoltCommon
      .parseList(response.body, ['posts', 'data', 'items', 'results'])
      .map((post) => feedjoltCommon.flattenPost(post));
  },
});
