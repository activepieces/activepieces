import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { Client } from '@microsoft/microsoft-graph-client';

export const createDraftEmailAction = createAction({
    auth: microsoftOutlookAuth,
    name: 'create_draft_email',
    displayName: 'Create Draft Email',
    description: 'Create a new draft email.',
    props: {
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        bodyFormat: Property.StaticDropdown({
            displayName: 'Body Format',
            required: true,
            defaultValue: 'text',
            options: {
                disabled: false,
                options: [
                    { label: 'HTML', value: 'html' },
                    { label: 'Text', value: 'text' },
                ],
            },
        }),
        body: Property.LongText({
            displayName: 'Body',
            required: true,
        }),
        toRecipients: Property.Array({
            displayName: 'To Recipients',
            description: 'The email addresses of the primary recipients.',
            required: true,
        }),
        ccRecipients: Property.Array({
            displayName: 'CC Recipients',
            description: 'The email addresses of the CC recipients.',
            required: false,
        }),
        bccRecipients: Property.Array({
            displayName: 'BCC Recipients',
            description: 'The email addresses of the BCC recipients.',
            required: false,
        }),
        attachments: Property.Array({
            displayName: 'Attachments',
            required: false,
            defaultValue: [],
            properties: {
                file: Property.File({
                    displayName: 'File',
                    required: true,
                }),
                fileName: Property.ShortText({
                    displayName: 'File Name',
                    required: false,
                }),
            },
        }),
    },
    async run(context) {
        const {
            subject,
            body,
            bodyFormat,
            toRecipients,
            ccRecipients,
            bccRecipients,
            attachments,
        } = context.propsValue;

        const mailPayload: Message = {
            subject: subject,
            body: {
                content: body,
                contentType: bodyFormat as BodyType,
            },
            toRecipients: (toRecipients as string[]).map((email) => ({
                emailAddress: { address: email },
            })),
            ccRecipients: ((ccRecipients as string[]) || []).map((email) => ({
                emailAddress: { address: email },
            })),
            bccRecipients: ((bccRecipients as string[]) || []).map((email) => ({
                emailAddress: { address: email },
            })),
            attachments: ((attachments as { file: ApFile; fileName: string }[]) || []).map(
                (attachment) => ({
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: attachment.fileName || attachment.file.filename,
                    contentBytes: attachment.file.base64,
                })
            ),
        };

        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(context.auth.access_token),
            },
        });

        try {
            const response: Message = await client.api('/me/messages').post(mailPayload);
            const draftId = response.id;

            return {
                success: true,
                message: 'Draft created successfully.',
                draftId: draftId,
                draftLink: `https://outlook.office.com/mail/drafts/id/${draftId}`,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to create draft: ${errorMessage}`);
        }
    },
});