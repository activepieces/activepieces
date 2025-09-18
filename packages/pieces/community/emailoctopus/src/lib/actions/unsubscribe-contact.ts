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
        const client = new EmailOctopusClient(context.auth);

        // The API requires an MD5 hash of the lowercase email to identify the contact.
        const contactId = createHash('md5')
            .update(email_address.toLowerCase())
            .digest('hex');

        const body = {
            status: 'UNSUBSCRIBED',
        };

        // This calls the PUT /lists/{list_id}/contacts/{contact_id} endpoint.
        return await client.makeRequest(
            HttpMethod.PUT,
            `/lists/${list_id}/contacts/${contactId}`,
            body
        );
    },
});