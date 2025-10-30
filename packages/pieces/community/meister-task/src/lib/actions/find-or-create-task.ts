import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, QueryParams } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient, MeisterTaskTask } from "../common/client";
import { meisterTaskProps } from "../common/props";

export const findOrCreateTask = createAction({
    auth: meisterTaskAuth,
    name: 'find_or_create_task',
    displayName: 'Find or Create Task',
    description: 'Finds a task by its name in a specific project. If not found, a new one will be created.',

    props: {
        project_id: meisterTaskProps.projectId(true),
        name: Property.ShortText({
            displayName: 'Task Name',
            description: 'The name of the task to find or create. Search is case-insensitive.',
            required: true,
        }),
        section_id: meisterTaskProps.sectionId(false),
        assignee_id: meisterTaskProps.assigneeId(false),
        description: Property.LongText({
            displayName: 'Description (if creating)',
            description: 'The description for the task (if created).',
            required: false,
        }),
        due_date: Property.ShortText({
            displayName: 'Due Date (if creating)',
            description: 'The due date in ISO 8601 format (e.g., "2025-11-15T18:00:00Z").',
            required: false,
        }),
    },

    async run(context) {
        const { project_id, name, section_id, assignee_id, description, due_date } = context.propsValue;
        const client = new MeisterTaskClient(context.auth);
        const taskName = name as string;

        if (!project_id) {
            throw new Error("Project ID is missing, but it is a required field.");
        }

        const query: QueryParams = {
            search: taskName,
            project_id: project_id.toString(),
        };

        const findResponse = await client.makeRequest<MeisterTaskTask[]>(
            HttpMethod.GET,
            '/tasks',
            undefined,
            query
        );

        const exactMatch = findResponse.find(task =>
            task.name.toLowerCase() === taskName.toLowerCase()
        );

        if (exactMatch) {
            return {
                status: "found",
                task: exactMatch
            };
        }

        const createBody: Record<string, unknown> = {
            name: taskName,
        };

        if (description) createBody['description'] = description;
        if (section_id) createBody['section_id'] = section_id;
        if (assignee_id) createBody['assignee_id'] = assignee_id;
        if (due_date) createBody['due_date'] = due_date;

        const createResponse = await client.makeRequest<MeisterTaskTask>(
            HttpMethod.POST,
            `/projects/${project_id}/tasks`,
            createBody
        );

        return {
            status: "created",
            task: createResponse
        };
    },
});
