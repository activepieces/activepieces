import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';


interface CapsuleParty {
    id: number;
    type: 'person' | 'organisation';
    [key: string]: any; 
}

export const findContact = createAction({
    auth: capsuleCrmAuth,
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Find a person or organisation by name, email, etc.',
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: "The value to search for (e.g., a name, email address, or phone number).",
            required: true,
        }),
        type: Property.StaticDropdown({
            displayName: 'Contact Type to Find',
            description: 'Optionally filter the results to only include people or organisations.',
            required: false,
            options: {
                options: [
                    { label: 'Any', value: 'any' },
                    { label: 'Person', value: 'person' },
                    { label: 'Organisation', value: 'organisation' },
                ]
            },
            defaultValue: 'any'
        }),
        fail_if_not_found: Property.Checkbox({
            displayName: 'Fail if Not Found',
            description: "If checked, this action will fail if no contact matching the search criteria is found.",
            required: false,
            defaultValue: false,
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const { query, type, fail_if_not_found } = propsValue;

     
        const response = await makeRequest<{ parties: CapsuleParty[] }>(
            auth,
            HttpMethod.GET,
            `/parties/search?q=${encodeURIComponent(query)}`
        );

        let results = response.parties;

       
        if (type && type !== 'any') {
            results = results.filter(party => party.type === type);
        }

        if (fail_if_not_found && results.length === 0) {
            throw new Error(`No contact found for query "${query}" with type "${type}".`);
        }

     
        return results;
    },
});