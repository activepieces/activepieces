import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { emailOctopusAuth } from "../common/auth";
import { EmailOctopusClient } from "../common/client";
import { emailOctopusProps } from "../common/props";

export const addOrUpdateContact = createAction({
    auth: emailOctopusAuth,
    name: 'add_or_update_contact',
    displayName: 'Add / Update Contact',
    description: 'Adds a new contact to a list or updates them if they already exist.',
    props: {
        list_id: emailOctopusProps.listId(),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: "The contact's email address.",
            required: true,
        }),
        fields: Property.Json({
            displayName: 'Fields',
            description: 'Custom fields for the contact. Use the field\'s tag as the key (e.g., {"FirstName": "John", "LastName": "Doe"}).',
            required: false,
            defaultValue: {},
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to associate with the contact.',
            required: false,
            defaultValue: [],
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'The status of the contact.',
            required: true,
            defaultValue: 'SUBSCRIBED',
            options: {
                options: [
                    { label: 'Subscribed', value: 'SUBSCRIBED' },
                    { label: 'Unsubscribed', value: 'UNSUBSCRIBED' },
                    { label: 'Pending', value: 'PENDING' },
                ],
            },
        }),
    },

    async run(context) {
        const { list_id, email_address, fields, tags, status } = context.propsValue;
        const client = new EmailOctopusClient(context.auth);

        const body = {
            email_address,
            fields,
            tags,
            status,
        };

        return await client.makeRequest(
            HttpMethod.POST,
            `/lists/${list_id}/contacts`,
            body
        );
    },
});