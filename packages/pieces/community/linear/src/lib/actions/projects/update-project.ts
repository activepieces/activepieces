import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';
import { LinearAuth, linearGraphql } from '../../common/graphql';
import { PROJECT_TEAM_IDS_QUERY } from '../../common/queries';
import { projectMutationOutputSchema } from '../../output-schemas';

export const linearUpdateProject = createAction({
  auth: linearAuth,
  name: 'linear_update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Update a existing project in Linear workspace',
  audience: 'human',
  aiMetadata: {
    description: 'Updates an existing Linear project identified by its project ID, changing fields such as name, description, icon, color, start/target dates, or status, and adds the selected team to the project without removing its other teams. Use to modify a project already created. Repeating the same update is idempotent.',
    idempotent: true,
  },
  props: {
    team_id: props.team_id(),
    project_id: props.project_id(),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Leave empty to keep the current name.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    icon: Property.ShortText({
      displayName: 'Icon',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      required: false,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    targetDate: Property.DateTime({
      displayName: 'Target Date',
      required: false,
    }),
    state: props.project_status(false),
  },
  outputSchema: projectMutationOutputSchema,
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const teamIds = await mergedTeamIds({
      auth,
      projectId: propsValue.project_id!,
      teamId: propsValue.team_id!,
    });
    const input: Record<string, unknown> = {
      teamIds,
      name: propsValue.name,
      description: propsValue.description,
      icon: propsValue.icon,
      color: propsValue.color,
      startDate: propsValue.startDate,
      targetDate: propsValue.targetDate,
    };
    const selectedState = propsValue['state'];
    if (selectedState != null && selectedState !== '') {
      const statuses = await client.listProjectStatuses();
      const match = statuses.find(
        (s: { type: string }) => s.type === selectedState,
      );
      if (match) {
        input['statusId'] = match.id;
      }
    }
    const query = `
      mutation UpdateProject($id: String!, $input: ProjectUpdateInput!) {
        projectUpdate(id: $id, input: $input) {
          success
          lastSyncId
          project {
            id
            name
            description
            color
            icon
            state
            startDate
            targetDate
            progress
            url
            createdAt
            updatedAt
          }
        }
      }
    `;
    const result = await client.rawRequest(query, {
      id: propsValue.project_id!,
      input,
    }) as { data: { projectUpdate: { success: boolean; lastSyncId: number; project: unknown } } };
    if (result.data.projectUpdate.success) {
      return {
        success: result.data.projectUpdate.success,
        lastSyncId: result.data.projectUpdate.lastSyncId,
        project: result.data.projectUpdate.project,
      };
    } else {
      throw new Error(`Unexpected error updating project`);
    }
  },
});

async function mergedTeamIds({
  auth,
  projectId,
  teamId,
}: {
  auth: LinearAuth;
  projectId: string;
  teamId: string;
}): Promise<string[]> {
  const data = await linearGraphql.request<{
    project: { id: string; teams: { nodes: Array<{ id: string }> } } | null;
  }>({ auth, query: PROJECT_TEAM_IDS_QUERY, variables: { id: projectId } });
  const current = data.project?.teams.nodes.map((team) => team.id) ?? [];
  return current.includes(teamId) ? current : [...current, teamId];
}
