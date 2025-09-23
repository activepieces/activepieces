import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';
import { partyDropdown, opportunityDropdown } from '../common/properties';

export const createProject = createAction({
    name: 'create_project',
    displayName: 'Create Project',
    description: 'Create a new project associated with a contact or opportunity',
    auth: capsuleAuth,
    props: {
        name: Property.ShortText({
            displayName: 'Project Name',
            description: 'Name of the project',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Detailed description of the project',
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
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Current status of the project',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'OPEN' },
                    { label: 'Completed', value: 'COMPLETED' },
                    { label: 'Cancelled', value: 'CANCELLED' }
                ]
            }
        }),
        expectedCloseDate: Property.DateTime({
            displayName: 'Expected Close Date',
            description: 'Expected completion date of the project',
            required: false,
        }),
        actualCloseDate: Property.DateTime({
            displayName: 'Actual Close Date',
            description: 'Actual completion date of the project',
            required: false,
        })
    },
    async run(context) {
        const props = context.propsValue as {
            name: string;
            description?: string;
            partyId?: string;
            opportunityId?: string;
            status?: string;
            expectedCloseDate?: string;
            actualCloseDate?: string;
        };

        const {
            name,
            description,
            partyId,
            opportunityId,
            status,
            expectedCloseDate,
            actualCloseDate
        } = props;

        // Zod validation
        await propsValidation.validateZod(context.propsValue, {
            name: z.string().min(1, 'Project name cannot be empty'),
            description: z.string().optional(),
            partyId: z.string().optional(),
            opportunityId: z.string().optional(),
            status: z.enum(['OPEN', 'COMPLETED', 'CANCELLED']).optional(),
            expectedCloseDate: z.string().optional(),
            actualCloseDate: z.string().optional(),
        });

        const project: Record<string, any> = {
            name
        };

        if (description) project['description'] = description;
        if (partyId) project['party'] = { id: parseInt(partyId) };
        if (opportunityId) project['opportunity'] = { id: parseInt(opportunityId) };
        if (status) project['status'] = status;
        if (expectedCloseDate) project['expectedCloseDate'] = expectedCloseDate;
        if (actualCloseDate) project['actualCloseDate'] = actualCloseDate;

        try {
            const response = await capsuleCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.POST,
                resourceUri: '/projects',
                body: { project }
            });

            return response.body;
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Check if the error is due to invalid party or opportunity
                let errorMessage = 'Failed to create project. ';

                if (partyId) {
                    errorMessage += 'The specified party may not exist or you may not have access to it. ';
                }
                if (opportunityId) {
                    errorMessage += 'The specified opportunity may not exist or you may not have access to it. ';
                }

                errorMessage += 'Please verify that the selected party and opportunity exist in your Capsule CRM account.';

                throw new Error(errorMessage);
            }

            // Re-throw other errors as-is
            throw error;
        }
    },
});
