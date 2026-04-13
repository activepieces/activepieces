import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { everhourAuth } from '../auth';
import { everhourApiCall } from '../common/client';

export const createTaskAction = createAction({
    auth: everhourAuth,
    name: 'create-task',
    displayName: 'Create Task',
    description: 'Creates a new task in a project.',
    props: {
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'The ID of the project to create the task in.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Task Name',
            description: 'The name of the task.',
            required: true,
        }),
    },
    async run(context) {
        const { projectId, name } = context.propsValue;

        const response = await everhourApiCall({
            apiKey: context.auth.secret_text,
            method: HttpMethod.POST,
            resourceUri: `/projects/${projectId}/tasks`,
            body: {
                name,
            },
        });

        return response;
    },
});