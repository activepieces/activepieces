import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl } from '../../common';

export const getListOfTasks = createAction({
    auth: gauzyAuth,
    name: 'list_tasks',
    displayName: 'List of Tasks',
    description: 'Get the list of all tasks created',
    props: {
        organizationId: Property.ShortText({
            displayName: 'Organization ID',
            required: true,
            description: 'ID of the organization to get tasks for',
        }),
        projectId: Property.ShortText({
            displayName: 'Project ID',
            required: false,
            description: 'ID of the project to get tasks for',
        }),
        status: Property.ShortText({
            displayName: 'Status',
            required: false,
            description: 'Filter tasks by status',
        }),
        title: Property.ShortText({
            displayName: 'Title',
            required: false,
            description: 'Filter tasks by title',
        }),
        take: Property.Number({
            displayName: 'Take',
            required: false,
            description: 'Number of records to take(limit)',
        }),
        skip: Property.Number({
            displayName: 'Skip',
            required: false,
            description: 'Number of records to skip(offset)',
        }),
        relations: Property.Array({
            displayName: 'Relations',
            required: false,
            description: 'Relations to include in the response (e.g: members, teams, tags)'
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        // Build query parameters
        const queryParams = new URLSearchParams();

        if (context.propsValue.organizationId) {
            queryParams.append('organizationId', context.propsValue.organizationId);
        }

        if (context.propsValue.projectId) {
            queryParams.append('projectId', context.propsValue.projectId);
        }

        if (context.propsValue.status) {
            queryParams.append('status', context.propsValue.status);
        }

        if (context.propsValue.title) {
            queryParams.append('title', context.propsValue.title);
        }

        if (context.propsValue.take) {
            queryParams.append('take', context.propsValue.take.toString());
        }

        if (context.propsValue.skip) {
            queryParams.append('skip', context.propsValue.skip.toString());
        }

        if (context.propsValue.relations && context.propsValue.relations.length > 0) {
            queryParams.append('relations', context.propsValue.relations.join(','));
        }

        const url = `${baseUrl}/api/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers,
        });

        return response.body;
    }
})