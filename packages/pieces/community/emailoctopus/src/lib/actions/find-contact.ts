import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon } from '../common/client';

export const findContact = createAction({
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Look up a contact by email address within a given list',
    auth: emailoctopusAuth,
    props: {
        list_id: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list to search in',
            required: true,
        }),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address of the contact to find',
            required: true,
        }),
    },
    async run(context) {
        const { list_id, email_address } = context.propsValue;

        const response = await emailoctopusCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: `/lists/${list_id}/contacts`,
            queryParams: {
                email: email_address
            }
        });

        const contacts = response.body?.data || [];
        return contacts.length > 0 ? contacts[0] : null;
    },
});
