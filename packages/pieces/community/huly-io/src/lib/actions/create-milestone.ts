import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

export const createMilestone = createAction({
    name: 'create_milestone',
    displayName: 'Create Milestone',
    description: 'Create a milestone in a project and assign open issues to it',
    props: {
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'The ID of the project to create the milestone in',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The name of the milestone',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The description of the milestone in Markdown format',
            required: false,
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: 'The due date for the milestone',
            required: false,
        }),
        issueIds: Property.Array({
            displayName: 'Issue IDs',
            description: 'IDs of open issues to assign to this milestone',
            required: false,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        const response = await client.request(
            'POST',
            '/milestones/create',
            {
                projectId: propsValue.projectId,
                name: propsValue.name,
                description: propsValue.description || '',
                dueDate: propsValue.dueDate || undefined,
                issueIds: propsValue.issueIds || []
            }
        );

        return response.data || {};
    },
});
