import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const updateTask = createAction({
    name: 'update_task',
    displayName: 'Update Task',
    description: 'Update an existing task in Teamwork',
    auth: teamworkAuth,
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'ID of the task to update',
            required: true,
        }),
        content: Property.ShortText({
            displayName: 'Task Name',
            description: 'Updated name/title of the task',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Updated description of the task',
            required: false,
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: 'Updated due date for the task',
            required: false,
        }),
        assignedTo: Property.ShortText({
            displayName: 'Assigned To (Person ID)',
            description: 'ID of the person to assign the task to',
            required: false,
        }),
        priority: Property.StaticDropdown({
            displayName: 'Priority',
            description: 'Priority level of the task',
            required: false,
            options: {
                options: [
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                ],
            },
        }),
    },
    async run(context) {
        const { taskId, content, description, dueDate, assignedTo, priority } = context.propsValue;

        const taskData: any = {
            'todo-item': {}
        };

        if (content) taskData['todo-item'].content = content;
        if (description) taskData['todo-item'].description = description;
        if (dueDate) taskData['todo-item']['due-date'] = new Date(dueDate).toISOString().split('T')[0];
        if (assignedTo) taskData['todo-item']['responsible-party-id'] = assignedTo;
        if (priority) taskData['todo-item'].priority = priority;

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/tasks/${taskId}.json`,
            body: taskData,
        });

        return response;
    },
});
