import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import dayjs from 'dayjs';
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
        entityType: Property.StaticDropdown({
            displayName: 'Associate With',
            description: 'Choose which entity to associate this task with (party, opportunity, or project)',
            required: false,
            options: {
                options: [
                    { label: 'None', value: 'none' },
                    { label: 'Party (Contact)', value: 'party' },
                    { label: 'Opportunity', value: 'opportunity' },
                    { label: 'Project', value: 'project' }
                ]
            }
        }),
        partyId: partyDropdown({
            refreshers: ['auth', 'entityType'],
            required: false,
        }),
        opportunityId: opportunityDropdown({
            refreshers: ['auth', 'entityType'],
            required: false,
        }),
        projectId: projectDropdown({
            refreshers: ['auth', 'entityType'],
            required: false,
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            description: 'Date when the task is due',
            required: false,
        })
    },
    async run(context) {
        const props = context.propsValue as {
            description: string;
            detail?: string;
            entityType?: string;
            partyId?: string;
            opportunityId?: string;
            projectId?: string;
            dueDate?: string;
        };

        const {
            description,
            detail,
            entityType,
            partyId,
            opportunityId,
            projectId,
            dueDate
        } = props;

        // Convert null values to undefined for proper optional handling
        const cleanedProps = {
            description,
            detail,
            entityType,
            partyId: partyId || undefined,
            opportunityId: opportunityId || undefined,
            projectId: projectId || undefined,
            dueDate
        };

        // Conditional Zod validation based on entity type
        const baseValidation = {
            description: z.string().min(1, 'Task description cannot be empty'),
            detail: z.string().optional(),
            entityType: z.enum(['none', 'party', 'opportunity', 'project']).optional(),
            dueDate: z.string().optional(),
        };

        // Add entity-specific validations based on entityType
        if (entityType === 'party') {
            Object.assign(baseValidation, {
                partyId: z.string().min(1, 'Party ID is required when associating with a party'),
                opportunityId: z.string().optional(),
                projectId: z.string().optional(),
            });
        } else if (entityType === 'opportunity') {
            Object.assign(baseValidation, {
                partyId: z.string().optional(),
                opportunityId: z.string().min(1, 'Opportunity ID is required when associating with an opportunity'),
                projectId: z.string().optional(),
            });
        } else if (entityType === 'project') {
            Object.assign(baseValidation, {
                partyId: z.string().optional(),
                opportunityId: z.string().optional(),
                projectId: z.string().min(1, 'Project ID is required when associating with a project'),
            });
        } else {
            // entityType is 'none' or undefined - all entity IDs are optional
            Object.assign(baseValidation, {
                partyId: z.string().optional(),
                opportunityId: z.string().optional(),
                projectId: z.string().optional(),
            });
        }

        await propsValidation.validateZod(cleanedProps, baseValidation);

        // Validate that selected entity type has corresponding ID
        if (entityType === 'party' && !cleanedProps.partyId) {
            throw new Error('Party must be selected when associating with a party');
        }
        if (entityType === 'opportunity' && !cleanedProps.opportunityId) {
            throw new Error('Opportunity must be selected when associating with an opportunity');
        }
        if (entityType === 'project' && !cleanedProps.projectId) {
            throw new Error('Project must be selected when associating with a project');
        }

        const task: Record<string, any> = {
            description
        };

        if (detail) task['detail'] = detail;

        // Only include the selected entity type
        switch (entityType) {
            case 'party':
                if (cleanedProps.partyId) task['party'] = { id: parseInt(cleanedProps.partyId) };
                break;
            case 'opportunity':
                if (cleanedProps.opportunityId) task['opportunity'] = { id: parseInt(cleanedProps.opportunityId) };
                break;
            case 'project':
                if (cleanedProps.projectId) task['kase'] = { id: parseInt(cleanedProps.projectId) }; // Note: projects are called "kase" in API
                break;
        }

        if (dueDate) task['dueOn'] = dayjs(dueDate).format('YYYY-MM-DD');

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/tasks',
            body: { task }
        });

        return response.body.task || response.body;
    },
});
