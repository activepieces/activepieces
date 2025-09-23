import { createAction, Property } from "@activepieces/pieces-framework";
import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { emailOctopusAuth } from "../common/auth";
import { emailOctopusProps } from "../common/props";

export const addOrUpdateContact = createAction({
    auth: emailOctopusAuth,
    name: 'add_or_update_contact',
    displayName: 'Add / Update Contact',
    description: 'Adds a new contact to a list or updates an existing contact if one exists.',
    props: {
        list_id: emailOctopusProps.listId(),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: "The contact's email address.",
            required: true,
        }),
        fields: emailOctopusProps.fields(), 
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to associate with the contact. Existing tags will not be removed.',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'The status of the contact.',
            required: false,
            options: {
                options: [
                    { label: 'Subscribed', value: 'subscribed' },
                    { label: 'Unsubscribed', value: 'unsubscribed' },
                    { label: 'Pending', value: 'pending' },
                ],
            },
        }),
    },

    async run(context) {
        const { list_id, email_address, fields, tags, status } = context.propsValue;
        
        const body: Record<string, unknown> = {
            email_address: email_address,
        };

        if (fields) {
            body['fields'] = Object.fromEntries(
                Object.entries(fields).filter(([, value]) => value !== null && value !== undefined && value !== '')
            );
        }
        if (status) {
            body['status'] = status;
        }


        const validTags = (tags as string[] | undefined)?.filter(tag => tag && tag.trim().length > 0);

        if (validTags && validTags.length > 0) {
            body['tags'] = Object.fromEntries(
                validTags.map(tag => [tag.trim(), true])
            );
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.PUT,
            url: `https://api.emailoctopus.com/lists/${list_id}/contacts`,
            body: body,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth,
            },
        });

        return response.body;
    },
});