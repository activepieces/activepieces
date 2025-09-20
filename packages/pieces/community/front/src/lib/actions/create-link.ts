import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const createLink = createAction({
    auth: frontAuth,
    name: "createLink",
    displayName: "Create Link",
    description: "Create a “Link” in Front (name, external URL).",
    props: {
        name: Property.ShortText({
            displayName: "Name",
            description: "Name of the link. If none is specified, the external_url is used as a default.",
            required: false,
        }),
        externalUrl: Property.ShortText({
            displayName: "External URL",
            description: "Underlying identifying url of the link.",
            required: false,
        }),
        pattern: Property.ShortText({
            displayName: "Pattern",
            description: "Pattern of the Link.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        if ((!propsValue.externalUrl && !propsValue.pattern) || (propsValue.externalUrl && propsValue.pattern)) {
            throw new Error("You must supply either pattern or external_url in the request, but not both");
        }

        return makeRequest(auth, HttpMethod.POST, "/links", {
            name: propsValue.name,
            external_url: propsValue.externalUrl,
            pattern: propsValue.pattern,
        });
    },
});
