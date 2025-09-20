import { createAction, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const updateConversation = createAction({
    auth: frontAuth,
    name: "updateConversation",
    displayName: "Update Conversation",
    description: "Modify conversation properties: status, assignee, inbox, tags etc.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "ID of the conversation.",
            required: true,
        }),
        assigneeId: Property.ShortText({
            displayName: "Assignee ID",
            description: "ID of the assignee.",
            required: false,
        }),
        inboxId: Property.ShortText({
            displayName: "Inbox ID",
            description: "ID of the inbox.",
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: "Status",
            description: "Status of the conversation.",
            required: false,
            options: {
                options: [
                    { label: "Archived", value: "archived" },
                    { label: "Open", value: "open" },
                    { label: "Deleted", value: "deleted" },
                    { label: "Spam", value: "spam" },
                ]
            }
        }),
        statusId: Property.ShortText({
            displayName: "Status ID",
            description: "Unique identifier of the status to set the conversation to.",
            required: false,
        }),
        tagIds: Property.Array({
            displayName: "Tag IDs",
            description: "List of all the tag IDs replacing the old conversation tags.",
            required: false,
            properties: {
                tagId: Property.ShortText({
                    displayName: "Tag ID",
                    description: "Unique identifier of the tag.",
                    required: true,
                }),
            }
        }),
        customFields: Property.Object({
            displayName: "Custom Fields",
            description: "Custom fields of the conversation.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(auth, HttpMethod.PATCH, `/conversations/${propsValue.conversationId}`, {
            assignee_id: propsValue.assigneeId,
            inbox_id: propsValue.inboxId,
            status: propsValue.status,
            status_id: propsValue.statusId,
            tag_ids: propsValue.tagIds,
            custom_fields: propsValue.customFields,
        });
    },
});
