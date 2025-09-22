import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon, emailoctopusSchemas } from '../common/client';
import { addTagToContactProps } from '../common/properties';

export const addTagToContact = createAction({
    name: 'add_tag_to_contact',
    displayName: 'Add Tag to Contact',
    description: 'Add a tag to a contact in a specified list',
    auth: emailoctopusAuth,
    props: addTagToContactProps(),
    async run(context) {
        await propsValidation.validateZod(context.propsValue, emailoctopusSchemas.addTagToContact);
        const { list_id, contact_id, tag } = context.propsValue;

        const tagsObject: Record<string, boolean> = {};
        tagsObject[tag as string] = true;

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
