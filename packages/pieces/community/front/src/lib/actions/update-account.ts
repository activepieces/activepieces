import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const updateAccount = createAction({
    auth: frontAuth,
    name: "updateAccount",
    displayName: "Update Account",
    description: "Update fields of an existing Account.",
    props: {
        accountId: Property.ShortText({
            displayName: "Account ID",
            description: "ID of the account.",
            required: true,
        }),
        name: Property.ShortText({
            displayName: "Name",
            description: "Name of the account.",
            required: false,
        }),
        description: Property.ShortText({
            displayName: "Description",
            description: "Description of the account.",
            required: false,
        }),
        domains: Property.Array({
            displayName: "Domains",
            description: "Domains of the account.",
            required: false,
            properties: {
                domain: Property.ShortText({
                    displayName: "Domain",
                    description: "Domain of the account.",
                    required: true,
                }),
            }
        }),
        custom_fields: Property.Object({
            displayName: "Custom Fields",
            description: "Custom fields of the account.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.PATCH, `/accounts/${propsValue.accountId}`, {
            name: propsValue.name,
            description: propsValue.description,
            domains: propsValue.domains,
            custom_fields: propsValue.custom_fields,
        });
    },
});
