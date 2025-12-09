import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const getContractWorkspace = createAction({
    auth: sapAribaAuth,
    name: 'get_contract_workspace',
    displayName: 'Get Contract Workspace',
    description: 'Search for a contract workspace using a unique identifier.',
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Unique identifier of the realm.',
            required: true,
        }),
        user: Property.ShortText({
            displayName: 'User',
            description: 'User ID to perform the action on behalf of.',
            required: true,
        }),
        passwordAdapter: Property.ShortText({
            displayName: 'Password Adapter',
            description: 'Password adapter to authenticate the user.',
            required: true,
        }),
        contractId: Property.ShortText({
            displayName: 'Contract ID',
            description: 'Contract ID (e.g., CW0001).',
            required: true,
        }),
        expand: Property.ShortText({
            displayName: 'Expand',
            description: 'Additional information to fetch (e.g., relatedFactories).',
            required: false,
        }),
    },
    async run(context) {
        const { realm, user, passwordAdapter, contractId, expand } = context.propsValue;

        const queryParams: Record<string, string> = {
            realm,
            user,
            passwordAdapter,
        };

        if (expand) {
            queryParams['$expand'] = expand;
        }

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.GET,
            `/contractWorkspaces/${encodeURIComponent(contractId)}`,
            queryParams
        );

        return response;
    },
});
