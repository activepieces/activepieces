import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const addConversationTags = createAction({
    auth: frontAuth,
    name: "addConversationTags",
    displayName: "Add Conversation Tags",
    description: "Add one or more tags to a conversation by ID.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "The conversation ID.",
            required: true,
        }),
        tags: Property.Array({
            displayName: "Tags",
            description: "Tags to add.",
            required: true,
            properties: {
                tag: Property.ShortText({
                    displayName: "Tag",
                    description: "The tag to add.",
                    required: true,
                }),
            },
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.POST, `/conversations/${propsValue.conversationId}/tags`, {
            tags: propsValue.tags,
        });
    },
});
