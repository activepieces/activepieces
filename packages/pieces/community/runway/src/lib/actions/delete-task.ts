import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { runwayAuth } from '../..';

export const deleteTask = createAction({
    auth: runwayAuth,
    name: 'delete_task',
    displayName: 'Cancel or Delete Task',
    description: 'Cancels a running task or deletes a completed task.',
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'The unique ID of the task you want to cancel or delete.',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const { taskId } = propsValue;

        await httpClient.sendRequest({
            url: `https://api.runwayml.com/v1/tasks/${taskId}`,
            method: HttpMethod.DELETE,
            headers: {
                'Authorization': `Bearer ${auth}`,
                'X-Runway-Version': '2024-11-06',
            },
        });

        
        return {
            success: true,
            message: `Task ${taskId} has been successfully canceled or deleted.`
        };
    },
});