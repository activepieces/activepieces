import { createAction, Property } from "@activepieces/pieces-framework";
import { ContentType, makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const sendReply = createAction({
    auth: frontAuth,
    name: "sendReply",
    displayName: "Send Reply",
    description: "Post a reply to a conversation (Conversation ID, body, attachments, tags, optionally archive).",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "ID of the conversation.",
            required: true,
        }),
        subject: Property.ShortText({
            displayName: "Subject",
            description: "Subject of the message.",
            required: false,
        }),
        body: Property.LongText({
            displayName: "Body",
            description: "Body of the message.",
            required: true,
        }),
        text: Property.LongText({
            displayName: "Text",
            description: "Text of the message.",
            required: false,
        }),
        quote_body: Property.LongText({
            displayName: "Quote Body",
            description: "Body for the quote that the message is referencing. Only available on email channels.",
            required: false,
        }),
        to: Property.Array({
            displayName: "To",
            description: "To of the message.",
            required: false,
            properties: {
                to: Property.ShortText({
                    displayName: "To",
                    description: "To of the message.",
                    required: true,
                }),
            }
        }),
        cc: Property.Array({
            displayName: "CC",
            description: "CC of the message.",
            required: false,
            properties: {
                cc: Property.ShortText({
                    displayName: "CC",
                    description: "CC of the message.",
                    required: true,
                }),
            }
        }),
        bcc: Property.Array({
            displayName: "BCC",
            description: "BCC of the message.",
            required: false,
            properties: {
                bcc: Property.ShortText({
                    displayName: "BCC",
                    description: "BCC of the message.",
                    required: true,
                }),
            }
        }),
        senderName: Property.ShortText({
            displayName: "Sender Name",
            description: "Sender name of the message.",
            required: false,
        }),
        authorId: Property.ShortText({
            displayName: "Author ID",
            description: "Author ID of the message.",
            required: false,
        }),
        channelId: Property.ShortText({
            displayName: "Channel ID",
            description: "ID of the channel.",
            required: false,
        }),
        tagIds: Property.Array({
            displayName: "Tag IDs",
            description: "List of tag IDs to add to the conversation.",
            required: false,
            properties: {
                tagId: Property.ShortText({
                    displayName: "Tag ID",
                    description: "Tag ID of the message.",
                    required: true,
                }),
            }
        }),
        archive: Property.Checkbox({
            displayName: "Archive",
            description: "Archive the conversation right when sending the message.",
            required: true,
        }),
        attachments: Property.Array({
            displayName: "Attachments",
            description: "Attachments of the message.",
            required: false,
            properties: {
                attachment: Property.File({
                    displayName: "Attachment",
                    description: "Attachment to be added to the message.",
                    required: true,
                }),
            }
        }),
        signatureId: Property.ShortText({
            displayName: "Signature ID",
            description: "Signature ID of the message.",
            required: false,
        }),
        shouldAddDefaultSignature: Property.Checkbox({
            displayName: "Should Add Default Signature",
            description: "Should add default signature of the message.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(
            auth,
            HttpMethod.POST,
            `/conversations/${propsValue.conversationId}/messages`,
            {
                to: propsValue.to,
                cc: propsValue.cc,
                bcc: propsValue.bcc,
                sender_name: propsValue.senderName,
                subject: propsValue.subject,
                author_id: propsValue.authorId,
                channel_id: propsValue.channelId,
                body: propsValue.body,
                quote_body: propsValue.quote_body,
                text: propsValue.text,
                options: {
                    tag_ids: propsValue.tagIds,
                    archive: propsValue.archive,
                },
                attachments: propsValue.attachments,
                signature_id: propsValue.signatureId,
                should_add_default_signature: propsValue.shouldAddDefaultSignature,
            },
            propsValue.attachments && propsValue.attachments.length > 0 ? ContentType.FORM_DATA : ContentType.JSON,
        );
    },
});
