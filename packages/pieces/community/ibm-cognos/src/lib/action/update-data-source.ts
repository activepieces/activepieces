import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callCognosApi, cognosCommon, CognosAuthValue } from '../common';

export const updateDataSource = createAction({
    name: 'update_data_source',
    displayName: 'Update Data Source',
    description: 'Updates an existing data source in IBM Cognos Analytics',
    props: {
        dataSourceId: Property.ShortText({
            displayName: 'Data Source ID',
            description: 'The ID of the data source to update',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Data Source Name',
            description: 'The new name of the data source',
            required: false,
        }),
        disabled: Property.Checkbox({
            displayName: 'Disabled',
            description: 'Set the disabled state of the data source',
            required: false,
        }),
        hidden: Property.Checkbox({
            displayName: 'Hidden',
            description: 'Set the hidden state of the data source',
            required: false,
        }),
    },
    async run(context) {
        const { dataSourceId, name, disabled, hidden } = context.propsValue;
        const auth = context.auth as CognosAuthValue;

        const updateBody: Record<string, unknown> = {};
        
        if (name !== undefined) {
            updateBody.defaultName = name;
        }
        if (disabled !== undefined) {
            updateBody.disabled = disabled;
        }
        if (hidden !== undefined) {
            updateBody.hidden = hidden;
        }

        const response = await callCognosApi(
            HttpMethod.PATCH,
            auth,
            `/datasources/${dataSourceId}`,
            updateBody
        );

        return response.body;
    },
});

