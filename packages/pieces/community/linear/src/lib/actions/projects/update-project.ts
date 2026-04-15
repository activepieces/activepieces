import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';

export const linearUpdateProject = createAction({
  auth: linearAuth,
  name: 'linear_update_project',
  displayName: 'Update Project',
  description: 'Update a existing project in Linear workspace',
  props: {
    team_id: props.team_id(),
    project_id: props.project_id(),
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
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
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const input: Record<string, unknown> = {
      teamIds: [propsValue.team_id!],
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
