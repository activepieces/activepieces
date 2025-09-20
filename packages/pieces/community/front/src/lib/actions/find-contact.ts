import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod, propsValidation } from "@activepieces/pieces-common";
import z from "zod";
import { frontAuth } from "../common/auth";

export const findContact = createAction({
    auth: frontAuth,
    name: "findContact",
    displayName: "Find Contact",
    description: "Look up a contact by handle (email, phone, etc.) or other identifying field.",
    props: {
        email: Property.ShortText({
            displayName: "Email",
            description: "Email address to search for.",
            required: false,
        }),
        phone: Property.ShortText({
            displayName: "Phone",
            description: "Phone number to search for.",
            required: false,
        }),
        custom_query: Property.ShortText({
            displayName: "Custom Query",
            description: "Custom query string.",
            required: false,
        }),
        limit: Property.Number({
            displayName: "Limit",
            description: "Limit of the query.",
            required: false,
            defaultValue: 10,
        }),
        pageToken: Property.ShortText({
            displayName: "Page Token",
            description: "Token to use to request the next page.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        await propsValidation.validateZod(propsValue, {
            limit: z.number().min(1).max(100),
        });

        const params: string[] = [];
        if (propsValue.email)
            params.push(`q[handles]=${encodeURIComponent(propsValue.email)}`);

        if (propsValue.phone)
            params.push(`q[handles]=${encodeURIComponent(propsValue.phone)}`);

        if (propsValue.custom_query)
            params.push(`q=${encodeURIComponent(propsValue.custom_query)}`);

        if (propsValue.limit)
            params.push(`limit=${propsValue.limit}`);
    
        if (propsValue.pageToken)
            params.push(`page_token=${encodeURIComponent(propsValue.pageToken)}`);

        const queryString: string = params.length ? `?${params.join("&")}` : "";
        return makeRequest(auth, HttpMethod.GET, `/contacts${queryString}`);
    },
});
