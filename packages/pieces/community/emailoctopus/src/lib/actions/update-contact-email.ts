import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon } from '../common/client';

export const updateContactEmail = createAction({
    name: 'update_contact_email',
    displayName: 'Update Contact\'s Email Address',
    description: 'Change the email address of a contact',
    auth: emailoctopusAuth,
    props: {
        list_id: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list containing the contact',
            required: true,
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to update',
            required: true,
        }),
        email_address: Property.ShortText({
            displayName: 'New Email Address',
            description: 'The new email address for the contact',
            required: true,
        }),
    },
    async run(context) {
        const { list_id, contact_id, email_address } = context.propsValue;

        const response = await emailoctopusCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/lists/${list_id}/contacts/${contact_id}`,
            body: {
                email_address
            }
        });

        return response.body;
    },
});
