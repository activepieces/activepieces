import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { partyDropdown, opportunityDropdown, projectStageDropdown } from '../common/props';

export const createProject = createAction({
    auth: capsuleCrmAuth,
    name: 'create_project',
    displayName: 'Create Project',
    description: 'Create a new Project associated with a contact or opportunity.',
    props: {
        partyId: partyDropdown,
        name: Property.ShortText({
            displayName: 'Name',
            description: 'A short name for the project.',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'A more detailed description of the project.',
            required: false,
        }),
        opportunityId: opportunityDropdown,
        stageId: projectStageDropdown,
        status: Property.StaticDropdown({
            displayName: 'Status',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'OPEN' },
                    { label: 'Closed', value: 'CLOSED' },
                ]
            },
            defaultValue: 'OPEN'
        }),
        expectedCloseOn: Property.ShortText({
            displayName: 'Expected Close Date',
            description: 'The date you expect to complete this project (YYYY-MM-DD).',
            required: false,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const {
            partyId,
            name,
            description,
            opportunityId,
            stageId,
            status,
            expectedCloseOn
        } = propsValue;

        const kasePayload: { [key: string]: any } = {
            party: { id: partyId },
            name,
            description,
            status,
            expectedCloseOn
        };

        if (opportunityId) {
            kasePayload['opportunity'] = { id: opportunityId };
        }
        if (stageId) {
            kasePayload['stage'] = { id: stageId };
        }

        const response = await makeRequest(
            auth,
            HttpMethod.POST,
            '/kases', 
            { kase: kasePayload }
        );

        return response;
    },
});