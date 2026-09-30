import { createAction, Property } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { addTeamsToWorkspaceActionOutputSchema } from '../../../output-schemas';
import { mondayAiProps } from '../../../common/ai-props';
import { mondayApi } from '../../../common/monday-api';
import { makeClient } from '../../../common';

export const addTeamsToWorkspaceAction = createAction({
  auth: mondayAuth,
  name: 'monday_add_teams_to_workspace',
  classification: 'WRITE',
  displayName: 'Add Teams to Workspace',
  description: 'Adds teams to a workspace as subscribers or owners.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Add whole teams to a monday.com workspace as subscribers or owners. Use to share a workspace with a team; for individual people use Add Users to Workspace. Re-adding teams already in the workspace leaves them unchanged, so it is safe to retry.",
    idempotent: true,
  },
  outputSchema: addTeamsToWorkspaceActionOutputSchema,
  props: {
    workspace_id: mondayAiProps.workspaceId(),
    team_ids: mondayAiProps.teamIds(),
    kind: Property.StaticDropdown({
      displayName: 'Role',
      required: true,
      defaultValue: 'subscriber',
      options: {
        options: [
          { label: 'Subscriber', value: 'subscriber' },
          { label: 'Owner', value: 'owner' },
        ],
      },
    }),
  },
  async run(context) {
    const { workspace_id, kind } = context.propsValue;
    const ids = mondayApi.toStringArray(context.propsValue.team_ids);
    if (ids.length === 0) {
      throw new Error('Provide at least one team ID.');
    }

    const data = await makeClient(context.auth).query<{ add_teams_to_workspace: { id: string; name: string }[] | null }>({
      query: `mutation ($workspace_id: ID!, $team_ids: [ID!]!, $kind: WorkspaceSubscriberKind) {
        add_teams_to_workspace(workspace_id: $workspace_id, team_ids: $team_ids, kind: $kind) { id name }
      }`,
      variables: { workspace_id, team_ids: ids, kind },
    });

    const teams = (data.add_teams_to_workspace ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
    }));

    return { workspace_id, role: kind, teams: teams, count: teams.length };
  },
});
