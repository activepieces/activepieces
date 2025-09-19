import { createAction, Property } from "@activepieces/pieces-framework";
import { ContentType, makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { frontAuth } from "../common/auth";

export const createDraftReply = createAction({
    auth: frontAuth,
    name: "createDraftReply",
    displayName: "Create Draft Reply",
    description: "Create a draft reply to an existing conversation (subject/quote etc.) without sending immediately.",
    props: {
        conversationId: Property.ShortText({
            displayName: "Conversation ID",
            description: "ID of the conversation.",
            required: true,
        }),
        channelId: Property.ShortText({
            displayName: "Channel ID",
            description: "ID of the channel from which the draft will be sent.",
            required: true,
        }),
        subject: Property.ShortText({
            displayName: "Subject",
            description: "Subject of the draft.",
            required: false,
        }),
        body: Property.LongText({
            displayName: "Body",
            description: "Body of the draft.",
            required: true,
        }),
        quoteBody: Property.LongText({
            displayName: "Quote Body",
            description: "Body for the quote that the message is referencing. Only available on email channels.",
            required: false,
        }),
        authorId: Property.ShortText({
            displayName: "Author ID",
            description: "ID of the teammate on behalf of whom the draft will be created.",
            required: false,
        }),
        to: Property.Array({
            displayName: "To",
            description: "List of recipient handles who will receive the message once the draft is sent.",
            required: true,
            properties: {
                to: Property.ShortText({
                    displayName: "To",
                    description: "Handle of the recipient.",
                    required: true,
                }),
            }
        }),
        cc: Property.Array({
            displayName: "CC",
            description: "List of recipient handles who will receive the message once the draft is sent.",
            required: false,
            properties: {
                cc: Property.ShortText({
                    displayName: "CC",
                    description: "Handle of the recipient.",
                    required: true,
                }),
            }
        }),
        bcc: Property.Array({
            displayName: "BCC",
            description: "List of recipient handles who will receive the message once the draft is sent.",
            required: false,
            properties: {
                bcc: Property.ShortText({
                    displayName: "BCC",
                    description: "Handle of the recipient.",
                    required: true,
                }),
            }
        }),
        attachments: Property.Array({
            displayName: "Attachments",
            description: "List of attachments to be added to the draft.",
            required: false,
            properties: {
                attachment: Property.File({
                    displayName: "Attachment",
                    description: "Attachment to be added to the draft.",
                    required: true,
                }),
            }
        }),
        mode: Property.StaticDropdown({
            displayName: "Mode",
            description: "Mode of the draft to create.",
            required: false,
            options: {
                options: [
                    { label: "Private", value: "private" },
                    { label: "Shared", value: "shared" },
                ]
            },
        }),
        signatureId: Property.ShortText({
            displayName: "Signature ID",
            description: "Signature ID to be added to the draft.",
            required: false,
        }),
        shouldAddDefaultSignature: Property.Checkbox({
            displayName: "Should Add Default Signature",
            description: "Whether or not Front should try to resolve a signature for the message.",
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        return makeRequest(
            auth, HttpMethod.POST,
            `/conversations/${propsValue.conversationId}/drafts`,
            {
                channel_id: propsValue.channelId,
                subject: propsValue.subject,
                body: propsValue.body,
                quote_body: propsValue.quoteBody,
                author_id: propsValue.authorId,
                to: propsValue.to,
                cc: propsValue.cc,
                bcc: propsValue.bcc,
                attachments: propsValue.attachments,
                mode: propsValue.mode,
                signature_id: propsValue.signatureId,
                should_add_default_signature: propsValue.shouldAddDefaultSignature,
            },
            propsValue.attachments && propsValue.attachments.length > 0 ? ContentType.FORM_DATA : ContentType.JSON,
        );
    },
});
