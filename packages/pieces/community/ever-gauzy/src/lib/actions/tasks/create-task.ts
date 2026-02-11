import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl, dynamicProps } from '../../common';

export const createTask = createAction({
    auth: gauzyAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new task in Gauzy',
    props: {
        organizationId: dynamicProps.organizations,
        tenantId: Property.ShortText({
            displayName: 'Tenant ID',
            required: true,
            description: 'ID of the tenant',
        }),
        title: Property.ShortText({
            displayName: 'Task Title',
            required: true,
            description: 'Title of the task',
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
            description: 'Detailed description of the task',
        }),
        projectId: dynamicProps.projects,
        taskStatusId: dynamicProps.taskStatuses,
        taskPriorityId: dynamicProps.taskPriorities,
        taskSizeId: dynamicProps.taskSizes,
        assignedEmployeeId: dynamicProps.employees,
        assignedTeamId: dynamicProps.teams,
        estimate: Property.Number({
            displayName: 'Estimated Hours',
            required: false,
            description: 'Estimated time to complete the task (in hours)',
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            required: false,
            description: 'When the task should be completed',
        }),
        startDate: Property.DateTime({
            displayName: 'Start Date',
            required: false,
            description: 'When work on the task should begin',
        }),
        isPublic: Property.Checkbox({
            displayName: 'Public Task',
            required: false,
            description: 'Whether the task is visible to all team members',
            defaultValue: true,
        }),
        isDraft: Property.Checkbox({
            displayName: 'Save as Draft',
            required: false,
            description: 'Save the task as a draft (not active)',
            defaultValue: false,
        }),
        parentId: Property.ShortText({
            displayName: 'Parent Task ID',
            required: false,
            description: 'ID of the parent task (for subtasks)',
        }),
        tags: Property.Array({
            displayName: 'Tags',
            required: false,
            description: 'Tags to categorize the task',
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        // Build the request body with required fields
        const body: Record<string, unknown> = {
            tenantId: context.propsValue.tenantId,
            organizationId: context.propsValue.organizationId,
            title: context.propsValue.title,
            public: context.propsValue.isPublic ?? true,
            isDraft: context.propsValue.isDraft ?? false,
        };

        // Add optional fields if provided
        if (context.propsValue['description']) body['description'] = context.propsValue['description'];
        if (context.propsValue['projectId']) body['projectId'] = context.propsValue['projectId'];
        if (context.propsValue['taskStatusId']) body['taskStatusId'] = context.propsValue['taskStatusId'];
        if (context.propsValue['taskPriorityId']) body['taskPriorityId'] = context.propsValue['taskPriorityId'];
        if (context.propsValue['taskSizeId']) body['taskSizeId'] = context.propsValue['taskSizeId'];
        if (context.propsValue['estimate'] !== undefined) body['estimate'] = context.propsValue['estimate'];
        if (context.propsValue['dueDate']) body['dueDate'] = context.propsValue['dueDate'];
        if (context.propsValue['startDate']) body['startDate'] = context.propsValue['startDate'];
        if (context.propsValue['parentId']) body['parentId'] = context.propsValue['parentId'];
        if (context.propsValue['tags']) body['tags'] = context.propsValue['tags'];

        // Add member assignments
        if (context.propsValue.assignedEmployeeId) {
            body['members'] = [{ id: context.propsValue.assignedEmployeeId }];
        }

        // Add team assignments
        if (context.propsValue.assignedTeamId) {
            body['teams'] = [{ id: context.propsValue.assignedTeamId }];
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/api/tasks`,
            headers,
            body,
        });

        return response.body;
    },
});