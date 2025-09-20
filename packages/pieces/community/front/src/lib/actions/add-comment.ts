import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { ContentType, makeRequest } from "../common/client";
import { frontAuth } from "../common/auth";

export const addComment = createAction({
    auth: frontAuth,
    name: "addComment",
    displayName: "Add Comment",
    description: "Add a comment to a conversation (internal note).",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "The conversation ID.",
            required: true,
        }),
        body: Property.LongText({
            displayName: "Body",
            description: "Content of the comment. Can include markdown formatting.",
            required: true,
        }),
        authorId: Property.ShortText({
            displayName: "Author ID",
            description: "The ID of the teammate creating the comment. If not provided, the comment will post as the API Token.",
            required: false,
        }),
        isPinned: Property.Checkbox({
            displayName: "Is Pinned",
            description: "Pin the comment.",
            required: false,
        }),
        attachments: Property.Array({
            displayName: "Attachments",
            description: "Attachments to be added to the comment.",
            required: false,
            properties: {
                file: Property.File({
                    displayName: "File",
                    description: "File to be attached to the comment.",
                    required: true,
                }),
            }
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(
            auth,
            HttpMethod.POST,
            `/conversations/${propsValue.conversationId}/comments`,
            {
                author_id: propsValue.authorId,
                body: propsValue.body,
                is_pinned: propsValue.isPinned,
                attachments: propsValue.attachments,
            },
            propsValue.attachments && propsValue.attachments.length > 0 ? ContentType.FORM_DATA : ContentType.JSON,
        );
    },
});
