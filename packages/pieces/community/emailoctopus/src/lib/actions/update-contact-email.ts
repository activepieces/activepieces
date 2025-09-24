import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { createHash } from "crypto";
import { emailOctopusAuth } from "../common/auth";
import { EmailOctopusClient } from "../common/client";
import { emailOctopusProps } from "../common/props";

export const updateContactEmail = createAction({
    auth: emailOctopusAuth,
    name: 'update_contact_email',
    displayName: "Update Contact's Email Address",
    description: "Change the email address of a contact in a list.",
    props: {
        list_id: emailOctopusProps.listId(),
        current_email_address: Property.ShortText({
            displayName: 'Current Email Address',
            description: "The contact's current email address used to find them.",
            required: true,
        }),
        new_email_address: Property.ShortText({
            displayName: 'New Email Address',
            description: "The new email address for the contact.",
            required: true,
        }),
    },

    async run(context) {
        const { list_id, current_email_address, new_email_address } = context.propsValue;
        const client = new EmailOctopusClient(context.auth);

        
        const contactId = createHash('md5')
            .update(current_email_address.toLowerCase())
            .digest('hex');

        const body = {
            email_address: new_email_address,
        };

        
        return await client.makeRequest(
            HttpMethod.PUT,
            `/lists/${list_id}/contacts/${contactId}`,
            body
        );
    },
});