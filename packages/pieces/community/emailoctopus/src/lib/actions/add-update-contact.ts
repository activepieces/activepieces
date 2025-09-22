import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon, emailoctopusSchemas } from '../common/client';
import { addUpdateContactProps } from '../common/properties';

export const addUpdateContact = createAction({
    name: 'add_update_contact',
    displayName: 'Add / Update Contact',
    description: 'Adds a new contact to a list or updates an existing contact if one exists',
    auth: emailoctopusAuth,
    props: addUpdateContactProps(),
    async run(context) {
        await propsValidation.validateZod(context.propsValue, emailoctopusSchemas.addUpdateContact);
        const { list_id, email_address, fields, tags, status } = context.propsValue;

        const contact: Record<string, any> = {
            email_address,
        };

        if (fields) {
            contact['fields'] = fields;
        }

        if (tags && tags.length > 0) {
            const tagsObject: Record<string, boolean> = {};
            tags.forEach((tagObj: any) => {
                tagsObject[tagObj.tag] = true;
            });
            contact['tags'] = tagsObject;
        }

        if (status) {
            contact['status'] = status;
        }

        const response = await emailoctopusCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/lists/${list_id}/contacts`,
            body: contact
        });

        return response.body;
    },
});
