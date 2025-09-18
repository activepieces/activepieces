import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { createHash } from "crypto";
import { emailOctopusAuth } from "../common/auth";
import { EmailOctopusClient } from "../common/client";
import { emailOctopusProps } from "../common/props";

export const addTagToContact = createAction({
    auth: emailOctopusAuth,
    name: 'add_tag_to_contact',
    displayName: 'Add Tag to Contact',
    description: 'Add one or more tags to a contact in a specified list.',
    props: {
        list_id: emailOctopusProps.listId(),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: "The contact's email address.",
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'The tags to add to the contact.',
            required: true,
        }),
    },

    async run(context) {
        const { list_id, email_address, tags } = context.propsValue;
        const client = new EmailOctopusClient(context.auth);

        // The API requires an MD5 hash of the lowercase email to identify the contact.
        const contactId = createHash('md5')
            .update(email_address.toLowerCase())
            .digest('hex');

        // Convert the array of tags into the required object format, e.g., { "vip": true, "customer": true }
        const tagsObject = Object.fromEntries(
            (tags as string[]).map(tag => [tag, true])
        );

        const body = {
            tags: tagsObject,
        };

        // This calls the PUT /lists/{list_id}/contacts/{contact_id} endpoint.
        return await client.makeRequest(
            HttpMethod.PUT,
            `/lists/${list_id}/contacts/${contactId}`,
            body
        );
    },
});