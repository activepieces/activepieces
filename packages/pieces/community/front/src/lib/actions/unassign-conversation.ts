import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const unassignConversation = createAction({
    auth: frontAuth,
    name: "unassignConversation",
    displayName: "Unassign Conversation",
    description: "Unassign a conversation from a teammate.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            required: true,
            description: "The conversation ID.",
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.PUT, `/conversations/${propsValue.conversationId}/assign`, {
            assignee_id: null,
        });
    },
});
