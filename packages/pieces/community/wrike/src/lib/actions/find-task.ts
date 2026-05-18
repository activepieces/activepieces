import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wrikeAuth } from '../common/auth';
import { wrikeCommon } from '../common/client';

export const findTask = createAction({
    name: 'find_task',
    displayName: 'Find Task',
    description: 'Retrieve a task by its ID or lookup fields',
    auth: wrikeAuth,
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'The ID of the task to retrieve. If provided, other search criteria will be ignored.',
            required: false,
        }),
        title: Property.ShortText({
            displayName: 'Task Title',
            description: 'Search for tasks by title (partial match)',
            required: false,
        }),
        folderId: Property.ShortText({
            displayName: 'Folder ID',
            description: 'Search for tasks within a specific folder',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter tasks by status',
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
            description: 'Filter tasks by importance/priority',
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
            displayName: 'Assignee IDs',
            description: 'Filter tasks by assignee user IDs',
            required: false,
            properties: {
                userId: Property.ShortText({
                    displayName: 'User ID',
                    required: true,
                }),
            },
        }),
        authors: Property.Array({
            displayName: 'Author IDs',
            description: 'Filter tasks by author user IDs',
            required: false,
            properties: {
                userId: Property.ShortText({
                    displayName: 'User ID',
                    required: true,
                }),
            },
        }),
        pageSize: Property.Number({
            displayName: 'Page Size',
            description: 'Maximum number of tasks to return (max 1000)',
            required: false,
            defaultValue: 100,
        }),
        sortField: Property.StaticDropdown({
            displayName: 'Sort Field',
            description: 'Field to sort tasks by',
            required: false,
            options: {
                options: [
                    { label: 'Created Date', value: 'CreatedDate' },
                    { label: 'Updated Date', value: 'UpdatedDate' },
                    { label: 'Due Date', value: 'DueDate' },
                    { label: 'Start Date', value: 'StartDate' },
                    { label: 'Completed Date', value: 'CompletedDate' },
                    { label: 'Title', value: 'Title' },
                    { label: 'Status', value: 'Status' },
                    { label: 'Importance', value: 'Importance' },
                ],
            },
        }),
        sortOrder: Property.StaticDropdown({
            displayName: 'Sort Order',
            description: 'Sort order for results',
            required: false,
            options: {
                options: [
                    { label: 'Ascending', value: 'Asc' },
                    { label: 'Descending', value: 'Desc' },
                ],
            },
        }),
    },
    async run(context) {
        const props = context.propsValue as any;
        const { taskId, title, folderId, status, importance, assignees, authors, pageSize, sortField, sortOrder } = props;

        if (taskId) {
            const response = await wrikeCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: `/tasks/${taskId}`,
            });
            return response.body;
        }

        const queryParams: Record<string, string> = {};

        if (title) queryParams['title'] = title;
        if (folderId) queryParams['folderId'] = folderId;
        if (status) queryParams['status'] = status;
        if (importance) queryParams['importance'] = importance;
        if (pageSize) queryParams['pageSize'] = pageSize.toString();
        if (sortField) queryParams['sortField'] = sortField;
        if (sortOrder) queryParams['sortOrder'] = sortOrder;

        if (assignees && assignees.length > 0) {
            queryParams['responsibles'] = assignees.map((assignee: any) => assignee.userId).join(',');
        }

        if (authors && authors.length > 0) {
            queryParams['authors'] = authors.map((author: any) => author.userId).join(',');
        }

        const response = await wrikeCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/tasks',
            queryParams,
        });

        return response.body;
    },
});
