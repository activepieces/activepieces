import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

export const listWorkspaces = createAction({
  auth: feedjoltAuth,
  name: 'list_workspaces',
  classification: 'SEARCH',
  displayName: 'List Workspaces',
  description: 'List Feedjolt workspaces available to this API key.',
  audience: 'both',
  aiMetadata: {
    description:
      'List workspaces the API key can access. Use first to discover the workspace slug required by every other Feedjolt action. Safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await feedjoltCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/workspaces',
    });
    return feedjoltCommon
      .parseList(response.body, ['workspaces', 'data', 'items'])
      .map((workspace) => feedjoltCommon.flattenWorkspace(workspace));
  },
});
