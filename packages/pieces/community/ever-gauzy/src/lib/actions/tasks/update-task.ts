import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth, getAuthHeaders, getBaseUrl } from '../../common';

export const updateTask = createAction({
    auth: gauzyAuth,
    name: 'update_task',
    displayName: 'Update Task',
    description: 'Update an existing task',
    props: {
        id: Property.ShortText({
            displayName: 'Task ID',
            required: true,
            description: 'The ID of the task to update',
        }),
        tenant: Property.Object({
            displayName: 'Tenant',
            required: false,
            description: 'Tenant information',
        }),
        tenantId: Property.ShortText({
            displayName: 'Tenant ID',
            required: false,
            description: 'ID of the tenant',
        }),
        organization: Property.Object({
            displayName: 'Organization',
            required: false,
            description: 'Organization information',
        }),
        organizationId: Property.ShortText({
            displayName: 'Organization ID',
            required: false,
            description: 'ID of the organization',
        }),
        title: Property.ShortText({
            displayName: 'Title',
            required: false,
            description: 'Title of the task',
        }),
        description: Property.LongText({
            displayName: 'Description',
            required: false,
            description: 'Description of the task',
        }),
        status: Property.ShortText({
            displayName: 'Status',
            required: false,
            description: 'Status of the task',
        }),
        priority: Property.ShortText({
            displayName: 'Priority',
            required: false,
            description: 'Priority of the task',
        }),
        size: Property.ShortText({
            displayName: 'Size',
            required: false,
            description: 'Size of the task',
        }),
        issueType: Property.ShortText({
            displayName: 'Issue Type',
            required: false,
            description: 'Issue type of the task',
        }),
        estimate: Property.Number({
            displayName: 'Estimate',
            required: false,
            description: 'Estimate for the task',
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            required: false,
            description: 'Due date of the task',
        }),
        isPublic: Property.Checkbox({
            displayName: 'Public',
            required: false,
            description: 'Whether the task is public',
        }),
        startDate: Property.DateTime({
            displayName: 'Start Date',
            required: false,
            description: 'Start date of the task',
        }),
        resolvedAt: Property.DateTime({
            displayName: 'Resolved At',
            required: false,
            description: 'Date when the task was resolved',
        }),
        version: Property.ShortText({
            displayName: 'Version',
            required: false,
            description: 'Version of the task',
        }),
        isDraft: Property.Checkbox({
            displayName: 'Is Draft',
            required: false,
            description: 'Whether the task is a draft',
        }),
        isScreeningTask: Property.Checkbox({
            displayName: 'Is Screening Task',
            required: false,
            description: 'Whether the task is a screening task',
        }),
        parentId: Property.ShortText({
            displayName: 'Parent ID',
            required: false,
            description: 'ID of the parent task',
        }),
        projectId: Property.ShortText({
            displayName: 'Project ID',
            required: false,
            description: 'ID of the project',
        }),
        organizationSprintId: Property.ShortText({
            displayName: 'Organization Sprint ID',
            required: false,
            description: 'ID of the organization sprint',
        }),
        taskStatusId: Property.ShortText({
            displayName: 'Task Status ID',
            required: false,
            description: 'ID of the task status',
        }),
        taskSizeId: Property.ShortText({
            displayName: 'Task Size ID',
            required: false,
            description: 'ID of the task size',
        }),
        taskPriorityId: Property.ShortText({
            displayName: 'Task Priority ID',
            required: false,
            description: 'ID of the task priority',
        }),
        taskTypeId: Property.ShortText({
            displayName: 'Task Type ID',
            required: false,
            description: 'ID of the task type',
        }),
        members: Property.Array({
            displayName: 'Members',
            required: false,
            description: 'Members assigned to the task',
        }),
        teams: Property.Array({
            displayName: 'Teams',
            required: false,
            description: 'Teams assigned to the task',
        }),
        tags: Property.Array({
            displayName: 'Tags',
            required: false,
            description: 'Tags for the task',
        }),
        modules: Property.Array({
            displayName: 'Modules',
            required: false,
            description: 'Modules for the task',
        }),
        mentionEmployeeIds: Property.Array({
            displayName: 'Mention Employee IDs',
            required: false,
            description: 'IDs of employees to mention',
        }),
    },
    async run(context) {
        const baseUrl = getBaseUrl(context.auth);
        const headers = getAuthHeaders(context.auth);

        // Build the request body with only the provided values
        const body: Record<string, unknown> = {};
        
        Object.entries(context.propsValue).forEach(([key, value]) => {
            if (key !== 'id' && value !== undefined && value !== null) {
                // Handle special case for "public" property since it's a reserved keyword in JavaScript
                if (key === 'isPublic') {
                    body['public'] = value;
                } else {
                    body[key] = value;
                }
            }
        });

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `${baseUrl}/api/tasks/${context.propsValue.id}`,
            headers,
            body,
        });

        return response.body;
    },
});
