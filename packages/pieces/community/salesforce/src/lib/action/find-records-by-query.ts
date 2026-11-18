import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { querySalesforceApi, salesforcesCommon } from '../common';
import { rawQueryOutputSchema } from '../output-schemas';

export const findRecordsByQuery = createAction({
    auth: salesforceAuth,
    name: 'find_records_by_query',
    classification: 'SEARCH',
    displayName: 'Find Records by Query',
    description: 'Finds up to 200 records of an object that match SOQL conditions.',
    audience: 'human',
    aiMetadata: { description: 'Search records of one Salesforce object by providing the object API name and a SOQL WHERE clause (no "WHERE" keyword); returns up to 200 matching records with all fields. Use this to look up or filter existing records by field conditions. Read-only and idempotent. Constraint: the WHERE clause is interpolated directly into the query, so it must be valid SOQL and properly escaped.', idempotent: true },
    outputSchema: rawQueryOutputSchema,
    props: {
        object: salesforcesCommon.object,
        where_clause: Property.ShortText({
            displayName: 'Conditions',
            description: 'SOQL conditions to filter by, without the WHERE keyword.',
            placeholder: "Industry = 'Technology' AND Name LIKE 'Acme%'",
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