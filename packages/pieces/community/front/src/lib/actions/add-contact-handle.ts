import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { contactHandleSource } from "../common/dropdown";
import { frontAuth } from "../common/auth";

export const addContactHandle = createAction({
    auth: frontAuth,
    name: "addContactHandle",
    displayName: "Add Contact Handle",
    description: "Add a handle (email, phone number, etc.) to an existing Contact.",
    props: {
        contactId: Property.ShortText({
            displayName: "Contact ID",
            description: "The ID of the contact.",
            required: true,
        }),
        handleSource: contactHandleSource,
        handle: Property.ShortText({
            displayName: "Handle",
            description: "Handle used to reach the contact.",
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.POST, `/contacts/${propsValue.contactId}/handles`, {
            handle: propsValue.handle,
            source: propsValue.handleSource,
        });
    },
});
