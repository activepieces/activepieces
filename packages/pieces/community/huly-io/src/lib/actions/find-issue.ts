import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

export const findIssue = createAction({
    name: 'find_issue',
    displayName: 'Find Issue',
    description: 'List issues in a project sorted by last modified date',
    props: {
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'The ID of the project to search for issues in',
            required: true,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter issues by status',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'open' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Closed', value: 'closed' },
                    { label: 'All', value: 'all' }
                ]
            },
            defaultValue: 'all'
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of issues to return',
            required: false,
            defaultValue: 10,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        const response = await client.request(
            'GET',
            '/issues/search',
            {
                projectId: propsValue.projectId,
                status: propsValue.status !== 'all' ? propsValue.status : undefined,
                limit: propsValue.limit || 10,
                sortBy: 'lastModified',
                sortOrder: 'desc'
            }
        );

        return response.data || [];
    },
});
