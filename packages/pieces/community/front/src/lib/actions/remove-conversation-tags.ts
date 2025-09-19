import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const removeConversationTags = createAction({
    auth: frontAuth,
    name: "removeConversationTags",
    displayName: "Remove Conversation Tags",
    description: "Remove tags from a conversation.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "ID of the conversation.",
            required: true,
        }),
        tagIds: Property.Array({
            displayName: "Tag IDs",
            description: "IDs of the tags.",
            required: true,
            properties: {
                tagId: Property.ShortText({
                    displayName: "Tag ID",
                    description: "ID of the tag.",
                    required: true,
                }),
            }
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.DELETE, `/conversations/${propsValue.conversationId}/tags`, {
            tag_ids: propsValue.tagIds,
        });
    },
});
