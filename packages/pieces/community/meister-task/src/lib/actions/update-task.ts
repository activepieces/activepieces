import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient } from "../common/client";
import { meisterTaskProps } from "../common/props";

export const updateTask = createAction({
    auth: meisterTaskAuth,
    name: 'update_task',
    displayName: 'Update Task',
    description: 'Updates an existing task.',

    props: {
        project_id: meisterTaskProps.projectId(true),
        task_id: meisterTaskProps.taskId(true),
        name: Property.ShortText({
            displayName: 'Task Name',
            description: 'The new name or title of the task.',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The new description or details of the task.',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'The new status of the task.',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'open' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Paused', value: 'paused' },
                    { label: 'Archived', value: 'archived' },
                    { label: 'Trashed', value: 'trashed' },
                ]
            }
        }),
        due_date: Property.ShortText({
            displayName: 'Due Date (ISO 8601)',
            description: 'The new due date (e.g., "2025-11-15T17:00:00Z").',
            required: false,
        }),
        assignee_id: meisterTaskProps.assigneeId(false),
    },

    async run(context) {
        const { task_id, name, description, status, due_date, assignee_id } = context.propsValue;
        const client = new MeisterTaskClient(context.auth);

        const body: Record<string, unknown> = {};
        if (name) body['name'] = name;
        if (description) body['description'] = description;
        if (status) body['status'] = status;
        if (due_date) body['due_date'] = due_date;
        if (assignee_id) body['assignee_id'] = assignee_id;

        return await client.makeRequest(
            HttpMethod.PUT,
            `/tasks/${task_id}`,
            body
        );
    },
});
