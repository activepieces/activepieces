import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { deleteTeamsFromWorkspaceActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const deleteTeamsFromWorkspaceAction = createAction({
  auth: mondayAuth,
  name: 'monday_delete_teams_from_workspace',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Teams from Workspace',
  description: 'Removes teams from a workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Revoke whole teams' membership of a monday.com workspace. Use for teams; for individual people use Remove Users from Workspace. Removing teams that are no longer members has no further effect.",
    idempotent: true,
  },
  outputSchema: deleteTeamsFromWorkspaceActionOutputSchema,
  props: {
    workspace_id: mondayAiProps.workspaceId(),
    team_ids: mondayAiProps.teamIds(),
  },
  async run(context) {
    const { workspace_id } = context.propsValue;
    const ids = mondayApi.toStringArray(context.propsValue.team_ids);
    if (ids.length === 0) {
      throw new Error('Provide at least one team ID.');
    }

    const data = await makeClient(context.auth).query<{ delete_teams_from_workspace: { id: string; name: string }[] | null }>({
      query: `mutation ($workspace_id: ID!, $team_ids: [ID!]!) {
        delete_teams_from_workspace(workspace_id: $workspace_id, team_ids: $team_ids) { id name }
      }`,
      variables: { workspace_id, team_ids: ids },
    });

    const teams = (data.delete_teams_from_workspace ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
    }));

    return { workspace_id, removed_teams: teams, count: teams.length };
  },
});
