import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon, emailoctopusSchemas } from '../common/client';
import { listDropdown, contactDropdown } from '../common/properties';

export const unsubscribeContact = createAction({
    name: 'unsubscribe_contact',
    displayName: 'Unsubscribe Contact',
    description: 'Remove a contact from a list (unsubscribe)',
    auth: emailoctopusAuth,
    props: {
        list_id: listDropdown({ required: true }),
        contact_id: contactDropdown({ required: true }),
    },
    async run(context) {
        await propsValidation.validateZod(context.propsValue, emailoctopusSchemas.unsubscribeContact);
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
