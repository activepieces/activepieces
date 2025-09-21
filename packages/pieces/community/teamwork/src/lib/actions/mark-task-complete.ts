import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const markTaskComplete = createAction({
    name: 'mark_task_complete',
    displayName: 'Mark Task Complete',
    description: 'Mark a task as complete in Teamwork',
    auth: teamworkAuth,
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'ID of the task to mark as complete',
            required: true,
        }),
    },
    async run(context) {
        const { taskId } = context.propsValue;

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/tasks/${taskId}/complete.json`,
        });

        return response;
    },
});
