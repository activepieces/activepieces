import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const removeTag = createAction({
    name: 'remove_tag',
    displayName: 'Remove Tag',
    description: 'Remove a tag from a contact',
    props: {
        email: {
            type: 'string',
            displayName: 'Email',
            required: true,
        },
        tag: {
            type: 'string',
            displayName: 'Tag',
            required: true,
        },
    },
    async run(context) {
        const response = await zohoCommon.makeRequest({
            auth: context.auth,
            method: HttpMethod.POST,
            path: '/contact/removetag',
            body: {
                email: context.propsValue.email,
                tag: context.propsValue.tag,
            },
        });

        return response;
    },
});
