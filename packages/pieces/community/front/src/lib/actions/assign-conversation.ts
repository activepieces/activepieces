import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const assignConversation = createAction({
    auth: frontAuth,
    name: "assignConversation",
    displayName: "Assign Conversation",
    description: "Assign a conversation to a teammate.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "The conversation ID.",
            required: true,
        }),
        assigneeId: Property.ShortText({
            displayName: "Assignee ID",
            description: "The assignee ID.",
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.PUT, `/conversations/${propsValue.conversationId}/assign`, {
            assignee_id: propsValue.assigneeId,
        });
    },
});
