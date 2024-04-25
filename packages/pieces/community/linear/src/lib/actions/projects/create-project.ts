import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { makeClient } from '../../common/client';
import { LinearDocument } from '@linear/sdk';

export const linearCreateProject = createAction({
  auth: linearAuth,
  name: 'linear_create_project',
  displayName: 'Create Project',
  description: 'Create a new project in Linear workspace',
  props: {
    team_id: props.team_id(),
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
    const project: LinearDocument.ProjectCreateInput = {
      teamIds: [propsValue.team_id!],
      name: propsValue.name,
      description: propsValue.description,
      icon: propsValue.icon,
      color: propsValue.color,
      startDate: propsValue.startDate,
      targetDate: propsValue.targetDate,
    };

    const client = makeClient(auth as string);
    const result = await client.createProject(project);
    if (result.success) {
      const createdProject = await result.project;
      return {
        success: result.success,
        lastSyncId: result.lastSyncId,
        project: createdProject,
      };
    } else {
      throw new Error(`Unexpected error: ${result}`)
    }
  },
});
