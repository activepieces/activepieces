import { createAction } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { zeroCodeKitStorage } from '../../common/storage';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const deleteAGlobalVariableAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'delete_a_global_variable',
    classification: 'DESTRUCTIVE',
    displayName: 'Delete a Global Variable',
    description: 'Permanently remove a global variable from 0CodeKit.',
    audience: 'both',
    aiMetadata: {
        description:
            'Permanently delete a global variable, identified by its name, from the connected 0CodeKit account. The value cannot be recovered. Only variables created with this account can be deleted. Fails if the variable no longer exists.',
        idempotent: false,
    },
    props: {
        variableName: zeroCodeKitStorage.variableName({
            description: 'The global variable to delete.',
        }),
    },
    outputSchema: filesStorageOutputSchemas.deletedGlobalVariable,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<DeleteVariableResponse>({
            apiKey: auth.secret_text,
            path: '/storage/globalvariables/del',
            body: {
                variableId: propsValue.variableName,
            },
        });
        return {
            deleted: true,
            variable_name: propsValue.variableName,
            message: response.message ?? null,
        };
    },
});

type DeleteVariableResponse = {
    message?: string;
};
