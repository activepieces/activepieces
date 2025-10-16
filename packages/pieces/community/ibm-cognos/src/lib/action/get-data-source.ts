import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callCognosApi, CognosAuthValue } from '../common';

export const getDataSource = createAction({
    name: 'get_data_source',
    displayName: 'Get Data Source',
    description: 'Retrieves the details of a specific data source from IBM Cognos Analytics',
    props: {
        dataSourceId: Property.ShortText({
            displayName: 'Data Source ID',
            description: 'The ID of the data source to retrieve',
            required: true,
        }),
    },
    async run(context) {
        const { dataSourceId } = context.propsValue;
        const auth = context.auth as CognosAuthValue;

        const response = await callCognosApi(
            HttpMethod.GET,
            auth,
            `/datasources/${dataSourceId}`
        );

        return response.body;
    },
});

