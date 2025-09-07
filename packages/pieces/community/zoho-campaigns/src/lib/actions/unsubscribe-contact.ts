import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribeContact = createAction({
    name: 'unsubscribe_contact',
    displayName: 'Unsubscribe Contact',
    description: 'Remove a contact from a mailing list',
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
            path: '/unsubscribe',
            body: {
                email: context.propsValue.email,
                listKey: context.propsValue.listKey,
            },
        });

        return response;
    },
});
