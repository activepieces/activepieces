import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitStorage } from '../../common/storage';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const listGlobalVariablesAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'list_global_variables',
    classification: 'SEARCH',
    displayName: 'List Global Variables',
    description: 'Get every global variable saved in your 0CodeKit account.',
    audience: 'both',
    aiMetadata: {
        description:
            'List all global variables in the connected 0CodeKit account, each with its name and text value, plus the total count. Takes no input. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {},
    outputSchema: filesStorageOutputSchemas.globalVariableList,
    async run({ auth }) {
        const variables = await zeroCodeKitStorage.listVariables(auth.secret_text);
        return {
            count: variables.length,
            variables: variables.map(zeroCodeKitStorage.toVariable),
        };
    },
});
