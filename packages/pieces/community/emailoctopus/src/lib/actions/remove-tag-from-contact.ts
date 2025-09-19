import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon } from '../common/client';

export const removeTagFromContact = createAction({
    name: 'remove_tag_from_contact',
    displayName: 'Remove Tag from Contact',
    description: 'Remove tag(s) from a contact in a list',
    auth: emailoctopusAuth,
    props: {
        list_id: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list containing the contact',
            required: true,
        }),
        contact_id: Property.ShortText({
            displayName: 'Contact ID',
            description: 'The ID of the contact to remove tags from',
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags to Remove',
            description: 'Tags to remove from the contact',
            required: true,
            properties: {
                tag: Property.ShortText({
                    displayName: 'Tag Name',
                    description: 'The name of the tag to remove',
                    required: true,
                })
            }
        }),
    },
    async run(context) {
        const { list_id, contact_id, tags } = context.propsValue;

        const tagsObject: Record<string, boolean> = {};
        tags.forEach((tagObj: any) => {
            tagsObject[tagObj.tag] = false;
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
