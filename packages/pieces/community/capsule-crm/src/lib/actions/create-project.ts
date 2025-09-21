import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

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
        partyId: Property.ShortText({
            displayName: 'Party ID',
            description: 'ID of the associated party (person or organisation)',
            required: false,
        }),
        opportunityId: Property.ShortText({
            displayName: 'Opportunity ID',
            description: 'ID of the associated opportunity (optional, but recommended to link with a party)',
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
        category: Property.ShortText({
            displayName: 'Category',
            description: 'Category or type of the project',
            required: false,
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
        const {
            name,
            description,
            partyId,
            opportunityId,
            status,
            category,
            expectedCloseDate,
            actualCloseDate
        } = context.propsValue;

        const project: Record<string, any> = {
            name
        };

        if (description) project['description'] = description;
        if (partyId) project['party'] = { id: parseInt(partyId) };
        if (opportunityId) project['opportunity'] = { id: parseInt(opportunityId) };
        if (status) project['status'] = status;
        if (category) project['category'] = category;
        if (expectedCloseDate) project['expectedCloseDate'] = expectedCloseDate;
        if (actualCloseDate) project['actualCloseDate'] = actualCloseDate;

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/projects',
            body: { project }
        });

        return response.body;
    },
});
