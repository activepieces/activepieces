import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { deftformAuth } from '../auth';
import { deftformApiCall, flattenObject } from '../common';

export const getWorkspaceDetails = createAction({
    auth: deftformAuth,
    name: 'get_workspace_details',
    displayName: 'Get Workspace Details',
    description: 'Retrieves all information about your Deftform workspace. Useful as a connection test.',
    props: {},
    async run(context) {
        const response = await deftformApiCall<Record<string, unknown>>({
            token: context.auth as unknown as string,
            method: HttpMethod.GET,
            path: '/workspace',
        });
        return flattenObject(response.body as Record<string, unknown>);
    },
});
