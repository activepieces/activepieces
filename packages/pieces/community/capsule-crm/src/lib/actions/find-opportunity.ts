import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';


interface CapsuleOpportunity {
    id: number;
    closedOn: string | null; 
    [key: string]: any; 
}

export const findOpportunity = createAction({
    auth: capsuleCrmAuth,
    name: 'find_opportunity',
    displayName: 'Find Opportunity',
    description: 'Find an Opportunity by search criteria.',
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: "The value to search for (e.g., an opportunity name or description).",
            required: true,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Optionally filter the results by opportunity status.',
            required: false,
            options: {
                options: [
                    { label: 'Any', value: 'any' },
                    { label: 'Open', value: 'open' },
                    { label: 'Closed', value: 'closed' },
                ]
            },
            defaultValue: 'any'
        }),
        fail_if_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: "If checked, this action will fail if no opportunity matching the criteria is found.",
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { query, status, fail_if_not_found } = propsValue;

        const response = await makeRequest<{ opportunities: CapsuleOpportunity[] }>(
            auth,
            HttpMethod.GET,
            `/opportunities/search?q=${encodeURIComponent(query)}`
        );

        let results = response.opportunities;

      
        if (status === 'open') {
            results = results.filter(opp => opp.closedOn === null);
        } else if (status === 'closed') {
            results = results.filter(opp => opp.closedOn !== null);
        }

        if (fail_if_not_found && results.length === 0) {
            throw new Error(`No opportunity found for query "${query}" with status "${status}".`);
        }

     
        return results;
    },
});