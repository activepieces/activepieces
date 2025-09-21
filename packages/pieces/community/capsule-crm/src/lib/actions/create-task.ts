import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const createTask = createAction({
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a new task',
    auth: capsuleAuth,
    props: {
        description: Property.ShortText({
            displayName: 'Task Description',
            description: 'Description of the task',
            required: true,
        }),
        detail: Property.LongText({
            displayName: 'Task Detail',
            description: 'Detailed information about the task',
            required: false,
        }),
        partyId: Property.ShortText({
            displayName: 'Party ID',
            description: 'ID of the associated party (person or organisation)',
            required: false,
        }),
        opportunityId: Property.ShortText({
            displayName: 'Opportunity ID',
            description: 'ID of the associated opportunity',
            required: false,
        }),
        projectId: Property.ShortText({
            displayName: 'Project ID',
            description: 'ID of the associated project',
            required: false,
        }),
        caseId: Property.ShortText({
            displayName: 'Case ID',
            description: 'ID of the associated case',
            required: false,
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: 'Date when the task is due',
            required: false,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'Category of the task',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Current status of the task',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'OPEN' },
                    { label: 'Completed', value: 'COMPLETED' }
                ]
            }
        }),
        priority: Property.StaticDropdown({
            displayName: 'Priority',
            description: 'Priority level of the task',
            required: false,
            options: {
                options: [
                    { label: 'Low', value: 'LOW' },
                    { label: 'Normal', value: 'NORMAL' },
                    { label: 'High', value: 'HIGH' }
                ]
            }
        })
    },
    async run(context) {
        const {
            description,
            detail,
            partyId,
            opportunityId,
            projectId,
            caseId,
            dueDate,
            category,
            status,
            priority
        } = context.propsValue;

        const task: Record<string, any> = {
            description
        };

        if (detail) task['detail'] = detail;
        if (partyId) task['party'] = { id: parseInt(partyId) };
        if (opportunityId) task['opportunity'] = { id: parseInt(opportunityId) };
        if (projectId) task['project'] = { id: parseInt(projectId) };
        if (caseId) task['kase'] = { id: parseInt(caseId) };
        if (dueDate) task['dueDate'] = dueDate;
        if (category) task['category'] = category;
        if (status) task['status'] = status;
        if (priority) task['priority'] = priority;

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/tasks',
            body: { task }
        });

        return response.body;
    },
});
