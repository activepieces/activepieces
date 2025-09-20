import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod, propsValidation } from "@activepieces/pieces-common";
import z from "zod";
import { frontAuth } from "../common/auth";

export const removeConversationLinks = createAction({
    auth: frontAuth,
    name: "removeConversationLinks",
    displayName: "Remove Conversation Links",
    description: "Remove external links from a conversation.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "ID of the conversation.",
            required: true,
        }),
        linkIds: Property.Array({
            displayName: "Link IDs",
            description: "IDs of the links.",
            required: true,
            properties: {
                linkId: Property.ShortText({
                    displayName: "Link ID",
                    description: "ID of the link.",
                    required: true,
                }),
            }
        }),
    },
    async run({ auth, propsValue }) {
        await propsValidation.validateZod(propsValue, {
            linkIds: z.array(z.string()).min(1).max(10),
        });

        return makeRequest(auth, HttpMethod.DELETE, `/conversations/${propsValue.conversationId}/links`, {
            link_ids: propsValue.linkIds,
        });
    },
});
