import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addContactToMailingList = createAction({
    name: 'add_contact_to_mailing_list',
    displayName: 'Add Contact to Mailing List',
    description: 'Add a contact to a mailing list',
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
            method: HttpMethod.POST,
            path: '/listsubscribe',
            body: {
                email: context.propsValue.email,
                listKey: context.propsValue.listKey,
            },
        });

        return response;
    },
});
