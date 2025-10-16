import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callCognosApi, CognosAuthValue } from '../common';

export const deleteDataSource = createAction({
    name: 'delete_data_source',
    displayName: 'Delete Data Source',
    description: 'Deletes a data source from IBM Cognos Analytics',
    props: {
        dataSourceId: Property.ShortText({
            displayName: 'Data Source ID',
            description: 'The ID of the data source to delete',
            required: true,
        }),
        force: Property.Checkbox({
            displayName: 'Force Delete',
            description: 'Force delete even if the data source is in use',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { dataSourceId, force } = context.propsValue;
        const auth = context.auth as CognosAuthValue;

        const queryParams = force ? { force: 'true' } : undefined;

        const response = await callCognosApi(
            HttpMethod.DELETE,
            auth,
            `/datasources/${dataSourceId}`,
            undefined,
            queryParams
        );

        return {
            success: true,
            message: `Data source ${dataSourceId} deleted successfully`,
        };
    },
});

