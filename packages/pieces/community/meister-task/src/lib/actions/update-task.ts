import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
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
        notes: Property.LongText({ 
            displayName: 'Notes (Description)',
            description: 'The new notes or description for the task.',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'The new status of the task.',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 1 }, { label: 'Completed', value: 2 },
                    { label: 'Trashed', value: 8 }, { label: 'Completed & Archived', value: 18 },
                ]
            }
        }),
        due: Property.ShortText({ 
            displayName: 'Due Date (ISO 8601)',
            description: 'The new due date (e.g., "2025-11-15T17:00:00Z").',
            required: false,
        }),
        assigned_to_id: meisterTaskProps.assigneeId(false), 
    },
    async run(context) {
        const { task_id, name, notes, status, due, assigned_to_id } = context.propsValue;
        const client = new MeisterTaskClient(context.auth.access_token);
        const body: Record<string, unknown> = {};
        if (name) body['name'] = name;
        if (notes) body['notes'] = notes; 
        if (status !== undefined) body['status'] = status; 
        if (due) body['due'] = due; 
        if (assigned_to_id) body['assigned_to_id'] = assigned_to_id;

        return await client.makeRequest(
            HttpMethod.PUT,
            `/tasks/${task_id}`,
            body
        );
    },
});