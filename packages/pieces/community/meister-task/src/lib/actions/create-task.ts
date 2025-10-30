
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient } from "../common/client";
import { meisterTaskProps } from "../common/props";

export const createTask = createAction({
    auth: meisterTaskAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Creates a new task in a specific project.',

    props: {
        project_id: meisterTaskProps.projectId(true),
        section_id: meisterTaskProps.sectionId(false),
        assignee_id: meisterTaskProps.assigneeId(false),

        name: Property.ShortText({
            displayName: 'Task Name',
            description: 'The name or title of the task.',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The description or details of the task.',
            required: false,
        }),
        due_date: Property.ShortText({
            displayName: 'Due Date (ISO 8601)',
            description: 'The due date in ISO 8601 format (e.g., "2025-11-15T18:00:00Z").',
            required: false,
        }),
    },

    async run(context) {
        const { project_id, name, section_id, description, due_date, assignee_id } = context.propsValue;
        const client = new MeisterTaskClient(context.auth);

        const body: Record<string, unknown> = {
            name: name,
            project_id: project_id,
        };

        if (section_id) body['section_id'] = section_id;
        if (description) body['description'] = description;
        if (due_date) body['due_date'] = due_date;
        if (assignee_id) body['assignee_id'] = assignee_id;
        
        return await client.makeRequest(
            HttpMethod.POST,
            `/tasks`,
            body
        );
    },
});
