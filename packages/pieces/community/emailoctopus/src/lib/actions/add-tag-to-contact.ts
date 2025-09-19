import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon } from '../common/client';

export const addTagToContact = createAction({
    name: 'add_tag_to_contact',
    displayName: 'Add Tag to Contact',
    description: 'Add one or more tags to a contact in a specified list',
    auth: emailoctopusAuth,
    props: {
        list_id: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list containing the contact',
            required: true,
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to add tags to',
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags to Add',
            description: 'Tags to add to the contact',
            required: true,
            properties: {
                tag: Property.ShortText({
                    displayName: 'Tag Name',
                    description: 'The name of the tag to add',
                    required: true,
                })
            }
        }),
    },
    async run(context) {
        const { list_id, contact_id, tags } = context.propsValue;

        const tagsObject: Record<string, boolean> = {};
        tags.forEach((tagObj: any) => {
            tagsObject[tagObj.tag] = true;
        });

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
