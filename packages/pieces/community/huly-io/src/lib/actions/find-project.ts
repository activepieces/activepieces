import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

export const findProject = createAction({
    name: 'find_project',
    displayName: 'Find Project',
    description: 'Retrieve a project by identifier and access basic information',
    props: {
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'The ID of the project to search for',
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Project Name',
            description: 'The name of the project to search for',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of projects to return',
            required: false,
            defaultValue: 10,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        const response = await client.request(
            'GET',
            '/projects/search',
            {
                id: propsValue.projectId || undefined,
                name: propsValue.name || undefined,
                limit: propsValue.limit || 10
            }
        );

        return response.data || [];
    },
});
