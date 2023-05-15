import { Property, createAction } from "@activepieces/pieces-framework";
import { salesforcesCommon } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { querySalesforceApi } from "../common";

export const runQuery = createAction({
    name: 'run_query',
    displayName: 'Run Query (Advanced)',
    description: 'Run a salesforce query',
    sampleData: {
    },
    props: {
        authentication: salesforcesCommon.authentication,
        query: Property.ShortText({
            displayName: 'Query',
            description: 'Enter the query',
            required: true,
        })
    },
    async run(context) {
        const { authentication, query } = context.propsValue;
        const response = await await querySalesforceApi<{ records: { CreatedDate: string }[] }>(
            HttpMethod.GET,
            authentication,
            query);
        return response;
    }
})