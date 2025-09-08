import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { runwayAuth } from '../..';

export const getTaskDetails = createAction({
    auth: runwayAuth,
    name: 'get_task_details',
    displayName: 'Get Task Details',
    description: 'Retrieve details of an existing Runway task by its ID.',
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'The unique ID of the task you want to check.',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const { taskId } = propsValue;

        const response = await httpClient.sendRequest({
            url: `https://api.runwayml.com/v1/tasks/${taskId}`,
            method: HttpMethod.GET,
            headers: {
                'Authorization': `Bearer ${auth}`,
                'X-Runway-Version': '2024-11-06',
            },
        });

        
        return response.body;
    },
});