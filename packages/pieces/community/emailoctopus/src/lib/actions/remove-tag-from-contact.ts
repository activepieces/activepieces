import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon, emailoctopusSchemas } from '../common/client';
import { removeTagFromContactProps } from '../common/properties';

export const removeTagFromContact = createAction({
    name: 'remove_tag_from_contact',
    displayName: 'Remove Tag from Contact',
    description: 'Remove a tag from a contact in a list',
    auth: emailoctopusAuth,
    props: removeTagFromContactProps(),
    async run(context) {
        await propsValidation.validateZod(context.propsValue, emailoctopusSchemas.removeTagFromContact);
        const { list_id, contact_id, tag } = context.propsValue;

        const tagsObject: Record<string, boolean> = {};
        tagsObject[tag as string] = false;

        const response = await emailoctopusCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PUT,
            resourceUri: `/lists/${list_id}/contacts/${contact_id}`,
            body: {
                tags: tagsObject
            }
        });

        return response.body;
    },
});
