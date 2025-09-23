import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';
import { partyDropdown, opportunityDropdown, projectDropdown } from '../common/properties';

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
        partyId: partyDropdown({
            refreshers: ['auth'],
            required: false,
        }),
        opportunityId: opportunityDropdown({
            refreshers: ['auth'],
            required: false,
        }),
        projectId: projectDropdown({
            refreshers: ['auth'],
            required: false,
        })
    },
    async run(context) {
        const props = context.propsValue as {
            description: string;
            detail?: string;
            partyId?: string;
            opportunityId?: string;
            projectId?: string;
        };

        const {
            description,
            detail,
            partyId,
            opportunityId,
            projectId
        } = props;

        // Zod validation
        await propsValidation.validateZod(context.propsValue, {
            description: z.string().min(1, 'Task description cannot be empty'),
            detail: z.string().optional(),
            partyId: z.string().optional(),
            opportunityId: z.string().optional(),
            projectId: z.string().optional(),
        });

        const task: Record<string, any> = {
            description
        };

        if (detail) task['detail'] = detail;
        if (partyId) task['party'] = { id: parseInt(partyId) };
        if (opportunityId) task['opportunity'] = { id: parseInt(opportunityId) };
        if (projectId) task['project'] = { id: parseInt(projectId) };

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/tasks',
            body: { task }
        });

        return response.body;
    },
});
