import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl } from '../../common';

export const deleteTask = createAction({
    auth: gauzyAuth,
    name: 'delete_task',
    displayName: 'Delete Task',
    description: 'Delete a task in Gauzy',
    props: {
        id: Property.ShortText({
            displayName: 'Task ID',
            required: true,
            description: 'ID of the task to delete',
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `${baseUrl}/api/tasks/${context.propsValue.id}`,
            headers,
        });
        return response.body;
    }
})