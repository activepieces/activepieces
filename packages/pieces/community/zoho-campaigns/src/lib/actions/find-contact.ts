import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Look up an existing contact by email address',
    props: {
        email: {
            type: 'string',
            displayName: 'Email',
            required: true,
        },
        listKey: {
            type: 'string',
            displayName: 'Mailing List Key',
            required: true,
        },
    },
    async run(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.GET,
            path: `/getcontacts?resfmt=JSON&listkey=${context.propsValue.listKey}&email=${context.propsValue.email}`,
        });

        return response;
    },
});
