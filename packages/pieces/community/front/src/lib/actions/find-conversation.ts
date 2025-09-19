import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod, propsValidation } from "@activepieces/pieces-common";
import z from "zod";
import { frontAuth } from "../common/auth";

export const findConversation = createAction({
    auth: frontAuth,
    name: "findConversation",
    displayName: "Find Conversation",
    description: "Find a conversation by search filters such as subject, participants, tags, inbox, etc.",
    props: {
        query: Property.ShortText({
            displayName: "Query",
            description: "Front query string (e.g. subject:\"Order\", tag_ids:tag_123, inbox_id:inb_456, etc.). See https://dev.frontapp.com/docs/search-1",
            required: true,
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

        return makeRequest(auth, HttpMethod.GET, `/conversations/search/${propsValue.query}`, {
            limit: propsValue.limit,
            pageToken: propsValue.pageToken,
        });
    },
});
