import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, QueryParams } from "@activepieces/pieces-common";
import { meisterTaskAuth } from "../common/auth";
import { MeisterTaskClient, MeisterTaskTask } from "../common/client";
import { meisterTaskProps } from "../common/props";

export const findTask = createAction({
    auth: meisterTaskAuth,
    name: 'find_task',
    displayName: 'Find Task',
    description: 'Finds a task by searching with filters.',

    props: {
        name: Property.ShortText({
            displayName: 'Task Name (Filter)',
            description: 'The name of the task to search for (supports partial matching).',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status (Filter)',
            description: 'Filter tasks by a specific status.',
            required: false,
            options: {
                options: [
                    { label: 'Active', value: 'active' },
                    { label: 'Archived', value: 'archived' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Trashed', value: 'trashed' },
                ]
            }
        }),
        project_id: meisterTaskProps.projectId(false),
        assignee_id: meisterTaskProps.assigneeId(false),
    },

    async run(context) {
        const { name, status, project_id, assignee_id } = context.propsValue;
        const client = new MeisterTaskClient(context.auth);

        const query: QueryParams = {};
        if (name) query['filter[name]'] = name;
        if (status) query['filter[status]'] = status as string;
        if (project_id) query['filter[project_id]'] = project_id.toString();
        if (assignee_id) query['filter[assignee_id]'] = assignee_id.toString();

        return await client.makeRequest<MeisterTaskTask[]>(
            HttpMethod.GET,
            `/tasks`,
            undefined,
            query
        );
    },
});
