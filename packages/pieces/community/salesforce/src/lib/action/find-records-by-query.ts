import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { querySalesforceApi, salesforcesCommon } from '../common';

export const findRecordsByQuery = createAction({
    auth: salesforceAuth,
    name: 'find_records_by_query',
    displayName: 'Find Records by Query (Advanced)',
    description: 'Finds records in an object using a SOQL WHERE clause.',
    props: {
        object: salesforcesCommon.object,
        where_clause: Property.ShortText({
            displayName: 'WHERE Clause',
            description: "Enter the WHERE clause for your SOQL query. For example: `Name = 'Acme' AND Industry = 'Technology'`. Do not include the 'WHERE' keyword.",
            required: true,
        })
    },
    async run(context) {
        const { object, where_clause } = context.propsValue;

        if (!object) {
            throw new Error('Object must be selected.');
        }

        const query = `SELECT FIELDS(ALL) FROM ${object} WHERE ${where_clause} LIMIT 200`;

        const response = await querySalesforceApi(
            HttpMethod.GET,
            context.auth,
            query
        );

        return response.body;
    },
});