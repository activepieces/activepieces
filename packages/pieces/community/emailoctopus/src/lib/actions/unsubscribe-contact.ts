import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { createHash } from "crypto";
import { emailOctopusAuth } from "../common/auth";
import { EmailOctopusClient } from "../common/client";
import { emailOctopusProps } from "../common/props";

export const unsubscribeContact = createAction({
    auth: emailOctopusAuth,
    name: 'unsubscribe_contact',
    displayName: 'Unsubscribe Contact',
    description: 'Sets a contact\'s status to "Unsubscribed" in a specific list.',
    audience: 'both',
    aiMetadata: { description: 'Marks a contact as unsubscribed in a specific EmailOctopus list, looked up by email address. Use to opt a known subscriber out of a list. Requires the list id and the contact email. Idempotent — re-running leaves the contact unsubscribed with no additional effect.', idempotent: true },
    props: {
        list_id: emailOctopusProps.listId(),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: "The email address of the contact to unsubscribe.",
            required: true,
        }),
    },

    async run(context) {
        const { list_id, email_address } = context.propsValue;
        const client = new EmailOctopusClient(context.auth.secret_text);

        
        const contactId = createHash('md5')
            .update(email_address.toLowerCase())
            .digest('hex');

        const body = {
            status: 'unsubscribed',
        };

        
        return await client.makeRequest(
            HttpMethod.PUT,
            `/lists/${list_id}/contacts/${contactId}`,
            body
        );
    },
});