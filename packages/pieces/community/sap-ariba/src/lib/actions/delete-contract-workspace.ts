import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sapAribaAuth } from '../auth';
import { sapAribaCommon } from '../common';

export const deleteContractWorkspace = createAction({
    auth: sapAribaAuth,
    name: 'delete_contract_workspace',
    displayName: 'Delete Contract Workspace',
    description: 'Delete a contract workspace in SAP Ariba Contracts.',
    props: {
        realm: Property.ShortText({
            displayName: 'Realm',
            description: 'Name of the SAP Ariba Contract site (e.g., testrealm).',
            required: true,
        }),
        user: Property.ShortText({
            displayName: 'User',
            description: 'User ID to perform the action on behalf of (e.g., testUser).',
            required: true,
        }),
        passwordAdapter: Property.ShortText({
            displayName: 'Password Adapter',
            description: 'Password adapter to authenticate the user (e.g., PasswordAdapter1).',
            required: true,
        }),
        contractId: Property.ShortText({
            displayName: 'Contract ID',
            description: 'The ID of the contract workspace to delete (e.g., CW0001).',
            required: true,
        }),
    },
    async run(context) {
        const { realm, user, passwordAdapter, contractId } = context.propsValue;

        const queryParams: Record<string, string> = {
            realm,
            user,
            passwordAdapter,
        };

        const response = await sapAribaCommon.makeRequest(
            context.auth,
            HttpMethod.DELETE,
            `/contractWorkspaces/${encodeURIComponent(contractId)}`,
            queryParams
        );

        return response;
    },
});
