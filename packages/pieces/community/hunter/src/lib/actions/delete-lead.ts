import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import { leadDeleteDropdownProp } from '../common/props';

export const deleteLeadAction = createAction({
    auth: hunterAuth,
    name: 'delete-lead',
    displayName: 'Delete Lead',
    description: 'Delete a specific lead record by ID.',
    props: {
        lead_id: leadDeleteDropdownProp,
    },
    async run(context) {
        const { lead_id } = context.propsValue;

        await hunterApiCall({
            apiKey: context.auth,
            endpoint: `/leads/${lead_id}`,
            method: HttpMethod.DELETE,
        });

        return { success: true };
    },
});
