import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl } from '../../common';

export  const getTask = createAction({
    auth: gauzyAuth,
    name: 'get_task',
    displayName: 'Get Task',
    description: 'Get a task by ID',
    props: {
        id: Property.ShortText({
            displayName: 'Task ID',
            required: true,
            description: 'ID of the task to retrieve',
        }),
        relations: Property.Array({
            displayName: 'Relations',
            required: false,
            description: 'Relations to include in the response (eg: members, tags, teams)'
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        const queryParams = new URLSearchParams();

        if (context.propsValue.relations && context.propsValue.relations.length > 0) {
            queryParams.append('relations', context.propsValue.relations.join(','));
        }

        const url = `${baseUrl}/api/tasks/${context.propsValue.id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers,
        });

        return response.body;
    }
})