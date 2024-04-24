import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';
import { LinearDocument } from '@linear/sdk';

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
  },
  async run({ auth, propsValue }) {
    const project: LinearDocument.ProjectUpdateInput = {
      teamIds: [propsValue.team_id!],
      name: propsValue.name,
      description: propsValue.description,
      icon: propsValue.icon,
      color: propsValue.color,
      startDate: propsValue.startDate,
      targetDate: propsValue.targetDate,
    };

    const client = makeClient(auth as string);
    const result = await client.updateProject(propsValue.project_id!, project);
    if (result.success) {
      const updatedProject = await result.project;
      return {
        success: result.success,
        lastSyncId: result.lastSyncId,
        project: updatedProject,
      };
    } else {
      throw new Error(`Unexpected error: ${result}`)
    }
  },
});
