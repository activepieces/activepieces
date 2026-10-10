import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

export const listBoards = createAction({
  auth: feedjoltAuth,
  name: 'list_boards',
  classification: 'SEARCH',
  displayName: 'List Boards',
  description: 'List feedback boards in a Feedjolt workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'List feedback boards in a workspace. Use to find a board slug or id before creating or listing posts. Safe to retry.',
    idempotent: true,
  },
  props: {
    workspaceSlug: feedjoltCommon.workspaceDropdown,
  },
  async run(context) {
    const response = await feedjoltCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspaces/${encodeURIComponent(context.propsValue.workspaceSlug)}/boards`,
    });
    return feedjoltCommon
      .parseList(response.body, ['boards', 'data', 'items'])
      .map((board) => feedjoltCommon.flattenBoard(board));
  },
});
