import { createAction, Property } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateDraftReplyAction = createAction({
    auth: gmailAuth,
    name: 'gmail_create_draft_reply',
    description: 'Generate a reply draft within an existing thread.',
    displayName: 'Create Draft Reply',
    props: {
        thread_id: Property.ShortText({
            displayName: 'Thread ID',
            description: 'Thread ID to reply within.',
            required: true,
        }),
        message_id: Property.ShortText({
            displayName: 'Original Message-ID',
            description: 'Message-ID to reply to (for threading).',
            required: true,
        }),
        to: Property.Array({
            displayName: 'To (optional)',
            description: 'Recipients (optional, usually auto-set by thread).',
            required: false,
        }),
        cc: Property.Array({
            displayName: 'CC Email',
            required: false,
        }),
        bcc: Property.Array({
            displayName: 'BCC Email',
            required: false,
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            required: false,
        }),
        body_type: Property.StaticDropdown({
            displayName: 'Body Type',
            required: true,
            defaultValue: 'plain_text',
            options: {
                disabled: false,
                options: [
                    { label: 'plain text', value: 'plain_text' },
                    { label: 'html', value: 'html' },
                ],
            },
        }),
        body: Property.ShortText({
            displayName: 'Body',
            required: true,
        }),
        attachment: Property.File({
            displayName: 'Attachment',
            required: false,
        }),
        attachment_name: Property.ShortText({
            displayName: 'Attachment Name',
            required: false,
        }),
    },
    async run(context) {
        const {
            thread_id, message_id,
            to, cc, bcc,
            subject, body, body_type,
            attachment, attachment_name,
        } = context.propsValue;

        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth);

        const gmail = google.gmail({ version: 'v1', auth: authClient });

        const mailOptions: Mail.Options = {
            to: (to && to.length > 0) ? to.join(', ') : undefined,
            cc: (cc && cc.length > 0) ? cc.join(', ') : undefined,
            bcc: (bcc && bcc.length > 0) ? bcc.join(', ') : undefined,
            subject,
            text: body_type === 'plain_text' ? body : undefined,
            html: body_type === 'html' ? body : undefined,
            headers: [
                { key: 'In-Reply-To', value: message_id },
                { key: 'References', value: message_id },
            ],
            attachments: [],
        };

        if (attachment) {
            const lookupResult = mime.lookup(attachment.extension || '');
            mailOptions.attachments = [
                {
                    filename: attachment_name ?? attachment.filename,
                    content: attachment.base64,
                    contentType: lookupResult || undefined,
                    encoding: 'base64',
                } as Attachment,
            ];
        }

        const mail = new MailComposer(mailOptions).compile();
        const mailBody = await mail.build();
        const encodedPayload = Buffer.from(mailBody)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

        return await gmail.users.drafts.create({
            userId: 'me',
            requestBody: {
                message: {
                    threadId: thread_id,
                    raw: encodedPayload,
                },
            },
        });
    },
});
