import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall, flattenObject } from '../common';

export const getWorkspaceDetails = createAction({
    auth: deftformAuth,
    name: 'get_workspace_details',
    displayName: 'Get Workspace Details',
    description: 'Retrieves all information about your Deftform workspace. Useful as a connection test.',
    audience: 'both',
    aiMetadata: { description: 'Fetch the Deftform workspace details (plan, limits, account-level settings). Use it to confirm the connection works or to read workspace-level context before working with forms. Read-only and idempotent; takes no input.', idempotent: true },
    props: {},
    async run(context) {
        const response = await deftformApiCall<Record<string, unknown>>({
            token: context.auth.secret_text,
            method: HttpMethod.GET,
            path: '/workspace',
        });
        return flattenObject(response.body);
    },
});
