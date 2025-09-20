import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const updateLink = createAction({
    auth: frontAuth,
    name: "updateLink",
    displayName: "Update Link",
    description: "Update the name or other metadata of a Link.",
    props: {
        linkId: Property.ShortText({
            displayName: "Link ID",
            description: "ID of the link.",
            required: true,
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Name of the link.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.PATCH, `/links/${propsValue.linkId}`, {
            name: propsValue.name,
        });
    },
});
