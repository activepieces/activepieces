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
            description: 'The name of the new project',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The description of the new project',
            required: false,
        }),
        icon: Property.ShortText({
            displayName: 'Icon',
            description: 'The icon for the new project',
            required: false,
        }),
        color: Property.ShortText({
            displayName: 'Color',
            description: 'The color for the new project',
            required: false,
        }),
        startDate: Property.DateTime({
            displayName: 'Start Date',
            description: 'The start date for the new project',
            required: false,
        }),
        targetDate: Property.DateTime({
            displayName: 'Target Date',
            description: 'The target date for the new project',
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
      return result;
    },
});
