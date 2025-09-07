import { createAction } from '@activepieces/pieces-framework';
import { zohoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addTagToContact = createAction({
    name: 'add_tag_to_contact',
    displayName: 'Add Tag to Contact',
    description: 'Apply a tag to a contact by email',
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
            path: '/contact/addtag',
            body: {
                email: context.propsValue.email,
                tag: context.propsValue.tag,
            },
        });

        return response;
    },
});
