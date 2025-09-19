import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon } from '../common/client';

export const unsubscribeContact = createAction({
    name: 'unsubscribe_contact',
    displayName: 'Unsubscribe Contact',
    description: 'Remove a contact from a list (unsubscribe)',
    auth: emailoctopusAuth,
    props: {
        list_id: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list containing the contact',
            required: true,
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to unsubscribe',
            required: true,
        }),
    },
    async run(context) {
        const { list_id, contact_id } = context.propsValue;

        const response = await emailoctopusCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/lists/${list_id}/contacts/${contact_id}`,
            body: {
                status: 'unsubscribed'
            }
        });

        return response.body;
    },
});
