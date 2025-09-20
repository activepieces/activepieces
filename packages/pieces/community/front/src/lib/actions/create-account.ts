import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const createAccount = createAction({
    auth: frontAuth,
    name: "createAccount",
    displayName: "Create Account",
    description: "Create a new account (e.g., company) in Front, with name, description, email domains, external ID, custom attributes.",
    props: {
        name: Property.ShortText({
            displayName: "Name",
            description: "Name of the Account.",
            required: true,
        }),
        description: Property.ShortText({
            displayName: "Description",
            description: "Account description.",
            required: false,
        }),
        domains: Property.Array({
            displayName: "Email Domains",
            description: "List of domains associated with the Account.",
            required: false,
            properties: {
                domain: Property.ShortText({
                    displayName: "Domain",
                    description: "Domain of the email domain.",
                    required: true,
                }),
            }
        }),
        externalId: Property.ShortText({
            displayName: "External ID",
            description: "ID of the Account in an external system.",
            required: false,
        }),
        customFields: Property.Object({
            displayName: "Custom Fields",
            description: "Custom fields of the Account.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.POST, "/accounts", {
            name: propsValue.name,
            description: propsValue.description,
            domains: propsValue.domains,
            external_id: propsValue.externalId,
            custom_fields: propsValue.customFields,
        });
    },
});
