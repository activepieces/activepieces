import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

export const createIssue = createAction({
    name: 'create_issue',
    displayName: 'Create Issue',
    description: 'Create a new issue under a project with a title, description, priority, and due date',
    props: {
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'The ID of the project to create the issue in',
            required: true,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the issue',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The description of the issue in Markdown format',
            required: false,
        }),
        priority: Property.StaticDropdown({
            displayName: 'Priority',
            description: 'The priority of the issue',
            required: false,
            options: {
                options: [
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                    { label: 'Critical', value: 'critical' }
                ]
            },
            defaultValue: 'medium'
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: 'The due date for the issue',
            required: false,
        }),
        assigneeId: Property.ShortText({
            displayName: 'Assignee ID',
            description: 'The ID of the person to assign the issue to',
            required: false,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        const response = await client.request(
            'POST',
            '/issues/create',
            {
                projectId: propsValue.projectId,
                title: propsValue.title,
                description: propsValue.description || '',
                priority: propsValue.priority || 'medium',
                dueDate: propsValue.dueDate || undefined,
                assigneeId: propsValue.assigneeId || undefined
            }
        );

        return response.data || {};
    },
});
