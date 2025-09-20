import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod, propsValidation } from "@activepieces/pieces-common";
import z from "zod";
import { frontAuth } from "../common/auth";

export const findAccount = createAction({
    auth: frontAuth,
    name: "findAccount",
    displayName: "Find Account",
    description: "Search existing account by email domain, external ID, etc.",
    props: {
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
        sortBy: Property.StaticDropdown({
            displayName: "Sort By",
            description: "Field used to sort the accounts..",
            required: false,
            options: {
                options: [
                    { label: "Created At", value: "created_at" },
                    { label: "Updated At", value: "updated_at" },
                ]
            },
        }),
        sortOrder: Property.StaticDropdown({
            displayName: "Sort Order",
            description: "Order by which results should be sorted.",
            required: false,
            options: {
                options: [
                    { label: "Ascending", value: "asc" },
                    { label: "Descending", value: "desc" },
                ]
            },
        }),
    },
    async run({ auth, propsValue }) {
        await propsValidation.validateZod(propsValue, {
            limit: z.number().min(1).max(100),
        });
        return makeRequest(auth, HttpMethod.GET, "/accounts", {
            limit: propsValue.limit,
            page_token: propsValue.pageToken,
            sort_by: propsValue.sortBy,
            sort_order: propsValue.sortOrder,
        });
    },
});
