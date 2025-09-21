import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const findTask = createAction({
    name: 'find_task',
    displayName: 'Find Task',
    description: 'Search for tasks in Teamwork',
    auth: teamworkAuth,
    props: {
        searchTerm: Property.ShortText({
            displayName: 'Search Term',
            description: 'Search term to find tasks by name or description',
            required: false,
        }),
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'Filter tasks by specific project ID',
            required: false,
        }),
        assignedTo: Property.ShortText({
            displayName: 'Assigned To (Person ID)',
            description: 'Filter tasks assigned to specific person',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter by task status',
            required: false,
            options: {
                options: [
                    { label: 'All', value: '' },
                    { label: 'Active', value: 'active' },
                    { label: 'Completed', value: 'completed' },
                ],
            },
        }),
    },
    async run(context) {
        const { searchTerm, projectId, assignedTo, status } = context.propsValue;

        let endpoint = '/tasks.json';
        const queryParams: Record<string, string> = {};

        if (searchTerm) queryParams['searchTerm'] = searchTerm;
        if (projectId) queryParams['projectIds'] = projectId;
        if (assignedTo) queryParams['responsible_party_ids'] = assignedTo;
        if (status && status !== '') queryParams['filter'] = status;

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: endpoint,
            queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        });

        return {
            tasks: response['todo-items'] || [],
            total: response['todo-items']?.length || 0,
        };
    },
});
