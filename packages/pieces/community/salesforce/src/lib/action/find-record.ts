import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { querySalesforceApi, salesforcesCommon } from '../common';

export const findRecord = createAction({
    auth: salesforceAuth,
    name: 'find_record',
    displayName: 'Find Record',
    description: 'Finds a record by a field value.',
    props: {
        object: salesforcesCommon.object,
        field: salesforcesCommon.field,
        search_value: Property.ShortText({
            displayName: 'Search Value',
            description: 'The value to search for in the selected field.',
            required: true,
        })
    },
    async run(context) {
        const { object, field, search_value } = context.propsValue;

        if (!object || !field) {
            throw new Error('Object and Field must be selected.');
        }

        const escapedSearchValue = search_value.replace(/'/g, "\\'");

        const query = `SELECT FIELDS(ALL) FROM ${object} WHERE ${field} = '${escapedSearchValue}' LIMIT 2000`;

        const response = await querySalesforceApi(
            HttpMethod.GET,
            context.auth,
            query
        );

        return response.body;
    },
});