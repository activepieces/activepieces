import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { createHash } from "crypto";
import { emailOctopusAuth } from "../common/auth";
import { EmailOctopusClient } from "../common/client";
import { emailOctopusProps } from "../common/props";

export const removeTagFromContact = createAction({
    auth: emailOctopusAuth,
    name: 'remove_tag_from_contact',
    displayName: 'Remove Tag from Contact',
    description: 'Remove one or more tags from a contact in a specified list.',
    props: {
        list_id: emailOctopusProps.listId(),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: "The email address of the contact to modify.",
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'The tags to remove from the contact.',
            required: true,
        }),
    },

    async run(context) {
        const { list_id, email_address, tags } = context.propsValue;
        const client = new EmailOctopusClient(context.auth);

        
        const contactId = createHash('md5')
            .update(email_address.toLowerCase())
            .digest('hex');

        
        const tagsObject = Object.fromEntries(
            (tags as string[]).map(tag => [tag, false])
        );

        const body = {
            tags: tagsObject,
        };

        
        return await client.makeRequest(
            HttpMethod.PUT,
            `/lists/${list_id}/contacts/${contactId}`,
            body
        );
    },
});