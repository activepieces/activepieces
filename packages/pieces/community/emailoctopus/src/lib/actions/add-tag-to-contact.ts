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
    audience: 'both',
    aiMetadata: { description: 'Applies one or more tags to a contact in an EmailOctopus list, located by email address. Use to label or segment a known subscriber. Requires the list id, the contact email, and the tags to add. Idempotent — re-adding tags that are already present leaves the contact unchanged.', idempotent: true },
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
        const client = new EmailOctopusClient(context.auth.secret_text);

        
        const contactId = createHash('md5')
            .update(email_address.toLowerCase())
            .digest('hex');

        
        const tagsObject = Object.fromEntries(
            (tags as string[]).map(tag => [tag, true])
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