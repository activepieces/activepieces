import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';


interface CapsuleKase {
    id: number;
    status: 'OPEN' | 'CLOSED';
    [key: string]: any; 
}

export const findProject = createAction({
    auth: capsuleCrmAuth,
    name: 'find_project',
    displayName: 'Find Project',
    description: 'Find a Project by search criteria.',
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: "The value to search for (e.g., a project name).",
            required: true,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Optionally filter the results by project status.',
            required: false,
            options: {
                options: [
                    { label: 'Any', value: 'any' },
                    { label: 'Open', value: 'OPEN' },
                    { label: 'Closed', value: 'CLOSED' },
                ]
            },
            defaultValue: 'any'
        }),
        fail_if_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: "If checked, this action will fail if no project matching the criteria is found.",
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { query, status, fail_if_not_found } = propsValue;

        
        const response = await makeRequest<{ kases: CapsuleKase[] }>(
            auth,
            HttpMethod.GET,
            `/kases/search?q=${encodeURIComponent(query)}`
        );

        let results = response.kases;

      
        if (status && status !== 'any') {
            results = results.filter(kase => kase.status === status);
        }

        if (fail_if_not_found && results.length === 0) {
            throw new Error(`No project found for query "${query}" with status "${status}".`);
        }

        
        return results;
    },
});