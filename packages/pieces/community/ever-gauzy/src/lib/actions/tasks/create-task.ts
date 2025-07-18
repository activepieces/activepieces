import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { gauzyAuth } from '../../../index';
import { getAuthHeaders, getBaseUrl } from '../../common';

export const createTask = createAction({
    auth: gauzyAuth,
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new task in Gauzy',
    props: {
        tenant: Property.Object({
            displayName: 'Tenant',
            required: false,
            description: 'Tenant information',
        }),
        tenantId: Property.ShortText({
            displayName: 'Tenant ID',
            required: true,
            description: 'ID of the tenant',
        }),
        organization: Property.Object({
            displayName: 'Organization',
            required: false,
            description: 'Organization information',
        }),
        organizationId: Property.ShortText({
            displayName: 'Organization ID',
            required: true,
            description: 'ID of the organization',
        }),
        title: Property.ShortText({
            displayName: 'Title',
            required: true,
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
            defaultValue: true,
        }),
        startDate: Property.DateTime({
            displayName: 'Start Date',
            required: false,
            description: 'Start date of the task',
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
            defaultValue: false,
        }),
        isScreeningTask: Property.Checkbox({
            displayName: 'Is Screening Task',
            required: false,
            description: 'Whether the task is a screening task',
            defaultValue: false,
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

        // Build the request body
        const body: Record<string, unknown> = {
            tenant: context.propsValue.tenant || {},
            tenantId: context.propsValue.tenantId,
            organization: context.propsValue.organization || {},
            organizationId: context.propsValue.organizationId,
            title: context.propsValue.title,
        };

        // Add optional fields if provided
        if (context.propsValue.description) body['description'] = context.propsValue.description;
        if (context.propsValue.status) body['status'] = context.propsValue.status;
        if (context.propsValue.priority) body['priority'] = context.propsValue.priority;
        if (context.propsValue.size) body['size'] = context.propsValue.size;
        if (context.propsValue.issueType) body['issueType'] = context.propsValue.issueType;
        if (context.propsValue.estimate !== undefined) body['estimate'] = context.propsValue.estimate;
        if (context.propsValue.dueDate) body['dueDate'] = context.propsValue.dueDate;
        if (context.propsValue.isPublic !== undefined) body['public'] = context.propsValue.isPublic;
        if (context.propsValue.startDate) body['startDate'] = context.propsValue.startDate;
        if (context.propsValue.version) body['version'] = context.propsValue.version;
        if (context.propsValue.isDraft !== undefined) body['isDraft'] = context.propsValue.isDraft;
        if (context.propsValue.isScreeningTask !== undefined) body['isScreeningTask'] = context.propsValue.isScreeningTask;
        if (context.propsValue.parentId) body['parentId'] = context.propsValue.parentId;
        if (context.propsValue.projectId) body['projectId'] = context.propsValue.projectId;
        if (context.propsValue.organizationSprintId) body['organizationSprintId'] = context.propsValue.organizationSprintId;
        if (context.propsValue.taskStatusId) body['taskStatusId'] = context.propsValue.taskStatusId;
        if (context.propsValue.taskSizeId) body['taskSizeId'] = context.propsValue.taskSizeId;
        if (context.propsValue.taskPriorityId) body['taskPriorityId'] = context.propsValue.taskPriorityId;
        if (context.propsValue.taskTypeId) body['taskTypeId'] = context.propsValue.taskTypeId;
        if (context.propsValue.members) body['members'] = context.propsValue.members;
        if (context.propsValue.teams) body['teams'] = context.propsValue.teams;
        if (context.propsValue.tags) body['tags'] = context.propsValue.tags;
        if (context.propsValue.modules) body['modules'] = context.propsValue.modules;
        if (context.propsValue.mentionEmployeeIds) body['mentionEmployeeIds'] = context.propsValue.mentionEmployeeIds;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${baseUrl}/api/tasks`,
            headers,
            body,
        });

        return response.body;
    },
});