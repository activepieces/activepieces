import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';
import { ClickupWorkspace } from '../../common/models';

export const clickupListWorkspaceMembers = createAction({
  auth: clickupAuth,
  name: 'clickup_list_workspace_members',
  displayName: 'List Workspace Members',
  description: 'List all members of a ClickUp workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every member of a ClickUp workspace, returning each member ID, username, and email. Pick this to resolve a person name or email to the numeric member ID needed for assigning tasks anywhere in the workspace; use Get List Members or Get Task Members to scope the result to a single list or task. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
  },
  async run(context) {
    const { workspace_id } = context.propsValue;
    const auth = getAccessTokenOrThrow(context.auth);

    const response = await callClickUpApi<{ teams: ClickupWorkspace[] }>(
      HttpMethod.GET,
      'team',
      auth,
      undefined
    );

    const workspace = response.body.teams.find(
      (team) => team.id === workspace_id
    );

    return { members: workspace?.members ?? [] };
  },
});
