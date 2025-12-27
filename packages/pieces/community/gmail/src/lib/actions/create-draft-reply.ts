import { createAction, Property } from '@activepieces/pieces-framework';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail from 'nodemailer/lib/mailer';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateDraftReplyAction = createAction({
  auth: gmailAuth,
  name: 'create_draft_reply',
  description: 'Create a draft reply to an existing email',
  displayName: 'Create Draft Reply',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to reply to',
      required: true,
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: true,
      defaultValue: 'plain_text',
      options: {
        disabled: false,
        options: [
          { label: 'Plain Text', value: 'plain_text' },
          { label: 'HTML', value: 'html' },
        ],
      },
    }),
    body: Property.LongText({
      displayName: 'Draft Body',
      description: 'The content of your draft reply',
      required: true,
    }),
    reply_all: Property.Checkbox({
      displayName: 'Reply All',
      description: 'Reply to all recipients of the original email',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Get the original message
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: context.propsValue.message_id,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Cc', 'Subject', 'Message-ID'],
    });

    const headers = originalMessage.data.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const originalFrom = getHeader('From');
    const originalTo = getHeader('To');
    const originalCc = getHeader('Cc');
    const originalSubject = getHeader('Subject');
    const originalMessageId = getHeader('Message-ID');
    const threadId = originalMessage.data.threadId;

    // Determine recipients
    let toRecipients = originalFrom;
    let ccRecipients: string | undefined;

    if (context.propsValue.reply_all) {
      const userInfo = await google.oauth2({ version: 'v2', auth: authClient }).userinfo.get();
      const selfEmail = userInfo.data.email || '';

      const allRecipients = [originalTo, originalCc]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map((e) => e.trim())
        .filter((e) => !e.toLowerCase().includes(selfEmail.toLowerCase()));

      if (allRecipients.length > 0) {
        ccRecipients = allRecipients.join(', ');
      }
    }

    const subject = originalSubject.startsWith('Re:')
      ? originalSubject
      : `Re: ${originalSubject}`;

    const subjectBase64 = Buffer.from(subject).toString('base64');

    const mailOptions: Mail.Options = {
      to: toRecipients,
      cc: ccRecipients,
      subject: `=?UTF-8?B?${subjectBase64}?=`,
      text: context.propsValue.body_type === 'plain_text' ? context.propsValue.body : undefined,
      html: context.propsValue.body_type === 'html' ? context.propsValue.body : undefined,
      headers: [
        { key: 'References', value: originalMessageId },
        { key: 'In-Reply-To', value: originalMessageId },
      ],
    };

    const mail: any = new MailComposer(mailOptions).compile();
    mail.keepBcc = true;
    const mailBody = await mail.build();

    const encodedPayload = Buffer.from(mailBody)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          threadId,
          raw: encodedPayload,
        },
      },
    });

    return response.data;
  },
});
