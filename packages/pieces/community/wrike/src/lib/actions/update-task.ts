import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wrikeAuth } from '../common/auth';
import { wrikeCommon } from '../common/client';

export const updateTask = createAction({
    name: 'update_task',
    displayName: 'Update Task',
    description: 'Update fields of an existing task in Wrike',
    auth: wrikeAuth,
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'The ID of the task to update',
            required: true,
        }),
        title: Property.ShortText({
            displayName: 'Task Title',
            description: 'The new title of the task',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The new description of the task',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'The new status of the task',
            required: false,
            options: {
                options: [
                    { label: 'Active', value: 'Active' },
                    { label: 'Completed', value: 'Completed' },
                    { label: 'Deferred', value: 'Deferred' },
                    { label: 'Cancelled', value: 'Cancelled' },
                ],
            },
        }),
        importance: Property.StaticDropdown({
            displayName: 'Importance',
            description: 'The new importance/priority of the task',
            required: false,
            options: {
                options: [
                    { label: 'Low', value: 'Low' },
                    { label: 'Normal', value: 'Normal' },
                    { label: 'High', value: 'High' },
                    { label: 'Critical', value: 'Critical' },
                ],
            },
        }),
        assignees: Property.Array({
            displayName: 'Assignees',
            description: 'User IDs to assign to the task (replaces existing assignees)',
            required: false,
            properties: {
                userId: Property.ShortText({
                    displayName: 'User ID',
                    required: true,
                }),
            },
        }),
        start_date: Property.DateTime({
            displayName: 'Start Date',
            description: 'Task start date',
            required: false,
        }),
        due_date: Property.DateTime({
            displayName: 'Due Date',
            description: 'Task due date',
            required: false,
        }),
        duration: Property.Number({
            displayName: 'Duration',
            description: 'Task duration in minutes',
            required: false,
        }),
        customFields: Property.Array({
            displayName: 'Custom Fields',
            description: 'Custom field values to update for the task',
            required: false,
            properties: {
                fieldId: Property.ShortText({
                    displayName: 'Field ID',
                    description: 'Custom field identifier',
                    required: true,
                }),
                value: Property.ShortText({
                    displayName: 'Value',
                    description: 'New field value',
                    required: true,
                }),
            },
        }),
    },
    async run(context) {
        const props = context.propsValue as any;
        const { taskId, title, description, status, importance, assignees, start_date, due_date, duration, customFields } = props;

        const taskData: Record<string, any> = {};

        if (title) taskData['title'] = title;
        if (description !== undefined) taskData['description'] = description;
        if (status) taskData['status'] = status;
        if (importance) taskData['importance'] = importance;

        if (assignees && assignees.length > 0) {
            taskData['responsibles'] = assignees.map((assignee: any) => assignee.userId);
        }

        const dates: Record<string, any> = {};
        if (start_date) dates['start'] = start_date;
        if (due_date) dates['due'] = due_date;
        if (duration) dates['duration'] = duration;
        if (Object.keys(dates).length > 0) {
            taskData['dates'] = dates;
        }

        if (customFields && customFields.length > 0) {
            taskData['customFields'] = customFields.map((field: any) => ({
                id: field.fieldId,
                value: field.value,
            }));
        }

        const response = await wrikeCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/tasks/${taskId}`,
            body: taskData,
        });

        return response.body;
    },
});
