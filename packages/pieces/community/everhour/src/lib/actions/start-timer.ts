import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { everhourAuth } from '../auth';
import { everhourApiCall } from '../common/client';

export const startTimerAction = createAction({
    auth: everhourAuth,
    name: 'start-timer',
    displayName: 'Start Timer',
    description: 'Starts a timer for a specific task.',
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'The ID of the task to start the timer for.',
            required: true,
        }),
    },
    async run(context) {
        const { taskId } = context.propsValue;

        const response = await everhourApiCall({
            apiKey: context.auth.secret_text,
            method: HttpMethod.POST,
            resourceUri: `/timers`,
            body: {
                task: taskId,
            },
        });

        return response;
    },
});