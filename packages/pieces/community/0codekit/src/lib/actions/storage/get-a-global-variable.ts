import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { GlobalVariable, zeroCodeKitStorage } from '../../common/storage';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const getAGlobalVariableAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'get_a_global_variable',
    classification: 'READ',
    displayName: 'Get a Global Variable',
    description: 'Read the value of a global variable saved in 0CodeKit.',
    audience: 'both',
    aiMetadata: {
        description:
            'Return the name and current text value of one global variable, identified by its name, from the connected 0CodeKit account. Only variables created with this account are visible. Read-only and safe to retry.',
        idempotent: true,
    },
    props: {
        variableName: zeroCodeKitStorage.variableName({
            description: 'The global variable to read.',
        }),
    },
    outputSchema: filesStorageOutputSchemas.globalVariable,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<GlobalVariable>({
            apiKey: auth.secret_text,
            path: '/storage/globalvariables/get',
            body: {
                variableName: propsValue.variableName,
            },
        });
        return zeroCodeKitStorage.toVariable(response);
    },
});
