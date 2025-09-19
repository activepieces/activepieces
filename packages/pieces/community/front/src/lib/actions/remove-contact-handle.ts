import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { contactHandleSource } from "../common/dropdown";
import { frontAuth } from "../common/auth";

export const removeContactHandle = createAction({
    auth: frontAuth,
    name: "removeContactHandle",
    displayName: "Remove Contact Handle",
    description: "Remove a handle from a contact.",
    props: {
        contactId: Property.ShortText({
            displayName: "Contact ID",
            description: "ID of the contact.",
            required: true,
        }),
        handle: Property.ShortText({
            displayName: "Handle",
            description: "Handle to remove.",
            required: true,
        }),
        source: contactHandleSource,
        force: Property.Checkbox({
            displayName: "Force",
            description: "Force the removal of the handle.",
            required: false,
            defaultValue: false,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.DELETE, `/contacts/${propsValue.contactId}/handles`, {
            handle: propsValue.handle,
            source: propsValue.source,
            force: propsValue.force,
        });
    },
});
