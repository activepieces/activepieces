import { createAction, Property } from '@activepieces/pieces-framework';
import { zeroCodeKitAuth } from '../../auth';
import { zeroCodeKitApi } from '../../common/client';
import { GlobalVariable, zeroCodeKitStorage } from '../../common/storage';
import { filesStorageOutputSchemas } from '../../common/output-schemas/files-storage';

export const addAGlobalVariableAction = createAction({
    auth: zeroCodeKitAuth,
    name: 'add_a_global_variable',
    classification: 'WRITE',
    displayName: 'Add a Global Variable',
    description: 'Save a value in 0CodeKit so any of your flows can read it later.',
    audience: 'both',
    aiMetadata: {
        description:
            'Create a global variable stored in the connected 0CodeKit account and return its name and value. If no name is given, 0CodeKit generates one; use the returned variable_name to read or delete it later. Values are stored as text. Creates a new record on each call, so do not retry blindly.',
        idempotent: false,
    },
    props: {
        variableName: Property.ShortText({
            displayName: 'Variable Name',
            description: 'The name to store the value under. Empty: 0CodeKit picks one.',
            required: false,
        }),
        variableValue: Property.LongText({
            displayName: 'Variable Value',
            description: 'The value to store. It is saved as text.',
            required: true,
        }),
    },
    outputSchema: filesStorageOutputSchemas.globalVariable,
    async run({ auth, propsValue }) {
        const response = await zeroCodeKitApi.post<GlobalVariable>({
            apiKey: auth.secret_text,
            path: '/storage/globalvariables/add',
            body: {
                variableName: propsValue.variableName?.trim(),
                variableValue: propsValue.variableValue,
            },
        });
        return zeroCodeKitStorage.toVariable(response);
    },
});
