import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon } from '../common/client';

export const addUpdateContact = createAction({
    name: 'add_update_contact',
    displayName: 'Add / Update Contact',
    description: 'Adds a new contact to a list or updates an existing contact if one exists',
    auth: emailoctopusAuth,
    props: {
        list_id: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list to add/update the contact in',
            required: true,
        }),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address of the contact',
            required: true,
        }),
        fields: Property.Object({
            displayName: 'Custom Fields',
            description: 'An object containing key/value pairs of field values',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to add to the contact',
            required: false,
            properties: {
                tag: Property.ShortText({
                    displayName: 'Tag Name',
                    description: 'The name of the tag to add',
                    required: true,
                })
            }
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'The status of the contact',
            required: false,
            options: {
                options: [
                    { label: 'Subscribed', value: 'subscribed' },
                    { label: 'Unsubscribed', value: 'unsubscribed' },
                    { label: 'Pending', value: 'pending' }
                ]
            }
        }),
    },
    async run(context) {
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
