import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const createTask = createAction({
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new task in a Teamwork project',
    auth: teamworkAuth,
    props: {
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'ID of the project to create the task in',
            required: true,
        }),
        content: Property.ShortText({
            displayName: 'Task Name',
            description: 'Name/title of the task',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Detailed description of the task',
            required: false,
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: 'Due date for the task',
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
        taskListId: Property.ShortText({
            displayName: 'Task List ID',
            description: 'ID of the task list to add the task to',
            required: false,
        }),
    },
    async run(context) {
        const { projectId, content, description, dueDate, assignedTo, priority, taskListId } = context.propsValue;

        const taskData: any = {
            'todo-item': {
                content,
                description: description || '',
                'due-date': dueDate ? new Date(dueDate).toISOString().split('T')[0] : undefined,
                priority: priority || 'medium',
                'responsible-party-id': assignedTo || undefined,
            }
        };

        // Remove undefined values
        Object.keys(taskData['todo-item']).forEach(key => {
            if (taskData['todo-item'][key] === undefined) {
                delete taskData['todo-item'][key];
            }
        });

        const endpoint = taskListId 
            ? `/projects/${projectId}/tasklists/${taskListId}/tasks.json`
            : `/projects/${projectId}/tasks.json`;

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: endpoint,
            body: taskData,
        });

        return response;
    },
});
