import { createAction, Property } from "@activepieces/pieces-framework";
// 👇 1. Remove `isAxiosError` and import `HttpError` instead
import { HttpError, HttpMethod } from "@activepieces/pieces-common";
import { createHash } from "crypto";
import { emailOctopusAuth } from "../common/auth";
import { EmailOctopusClient } from "../common/client";
import { emailOctopusProps } from "../common/props";

export const findContact = createAction({
    auth: emailOctopusAuth,
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Finds a contact by email address within a given list.',
    props: {
        list_id: emailOctopusProps.listId(),
        email_address: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address of the contact to find.',
            required: true,
        }),
    },

    async run(context) {
        const { list_id, email_address } = context.propsValue;
        const client = new EmailOctopusClient(context.auth);

        const contactId = createHash('md5')
            .update(email_address.toLowerCase())
            .digest('hex');

        try {
            const response =  await client.makeRequest(
                HttpMethod.GET,
                `/lists/${list_id}/contacts/${contactId}`
            );

            return {
                found:true,
                result:response
            }
        } catch (error) {
            
            if (error instanceof HttpError && error.response.status === 404) {
                return {
                    found:false,
                    result:{}
                };
            }
            throw error;
        }
    },
});