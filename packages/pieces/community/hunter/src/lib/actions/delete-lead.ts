import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { hunterApiCall } from '../common';
import { hunterAuth } from '../../index';
import { leadIdProp } from '../common/props';

export const deleteLeadAction = createAction({
    auth: hunterAuth,
    name: 'delete-lead',
    displayName: 'Delete Lead',
    description: `
    Deletes an existing lead by its ID.
    This call returns no content (HTTP 204) on success.
  `,
    props: {
        lead_id: leadIdProp,
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
