import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callCognosApi, CognosAuthValue } from '../common';

export const createDataSource = createAction({
    name: 'create_data_source',
    displayName: 'Create Data Source',
    description: 'Creates a new data source in IBM Cognos Analytics',
    props: {
        name: Property.ShortText({
            displayName: 'Data Source Name',
            description: 'The name of the data source',
            required: true,
        }),
        connectionString: Property.LongText({
            displayName: 'Connection String',
            description: 'The connection string for the data source',
            required: true,
        }),
        disabled: Property.Checkbox({
            displayName: 'Disabled',
            description: 'Set to true to create the data source in a disabled state',
            required: false,
            defaultValue: false,
        }),
        hidden: Property.Checkbox({
            displayName: 'Hidden',
            description: 'Set to true to hide the data source',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { name, connectionString, disabled, hidden } = context.propsValue;
        const auth = context.auth as CognosAuthValue;

        const response = await callCognosApi(
            HttpMethod.POST,
            auth,
            '/datasources',
            {
                defaultName: name,
                connectionString: connectionString,
                disabled: disabled || false,
                hidden: hidden || false,
            }
        );

        return response.body;
    },
});

