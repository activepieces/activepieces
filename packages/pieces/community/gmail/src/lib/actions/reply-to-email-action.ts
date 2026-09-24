import { createAction, Property } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { gmailAuth, createGoogleClient, getUserEmail } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { replyToEmailActionOutputSchema } from '../output-schemas';

export const gmailReplyToEmailAction = createAction({
  auth: gmailAuth,
  name: 'reply_to_email',
  classification: 'WRITE',
  displayName: 'Reply to Email',
  description: 'Reply to an existing email.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends a reply to an existing email, preserving the thread and subject and addressing the original sender (reply) or all participants (reply all). Use this to respond within a known conversation; requires the Gmail message ID of the email being answered. Not idempotent: each call sends a new reply message into the thread.',
    idempotent: false,
  },
  props: {
    message_id: GmailProps.message,
    reply_type: Property.StaticDropdown({
      displayName: 'Reply Type',
      description: 'Reply to the sender only, or to everyone on the thread.',
      required: true,
      defaultValue: 'reply',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Reply',
            value: 'reply',
            description: 'Sender only',
            icon: 'reply',
          },
          {
            label: 'Reply All',
            value: 'reply_all',
            description: 'Everyone on the thread',
            icon: 'reply-all',
          },
        ],
      },
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      description: 'How the text in Body is interpreted.',
      required: true,
      defaultValue: 'plain_text',
      display: 'cards',
      options: {
        disabled: false,
        options: [
          {
            label: 'Plain Text',
            value: 'plain_text',
            description: 'Sent as written',
            icon: 'text',
          },
          {
            label: 'Rich Text',
            value: 'html',
            description: 'Bold, links, lists',
            icon: 'type',
          },
          {
            label: 'HTML Code',
            value: 'html_code',
            description: 'Paste your own markup',
            icon: 'code',
          },
        ],
      },
    }),
    body: Property.RichText({
      displayName: 'Body',
      required: true,
      formatProperty: 'body_type',
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name shown in the inbox instead of your address.',
      placeholder: 'Jane at Acme',
      required: false,
      advanced: true,
    }),
    attachment: Property.File({
      displayName: 'Attachment',
      description: 'File to attach.',
      required: false,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Overrides the uploaded file name.',
      placeholder: 'report.pdf',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: replyToEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: context.propsValue.message_id,
      format: 'full',
    });

    if (!originalMessage.data || !originalMessage.data.payload) {
      throw new Error('Could not fetch original message details');
    }

    const headers = originalMessage.data.payload.headers || [];
    const headerMap = headers.reduce(
      (acc: { [key: string]: string }, header) => {
        if (header.name && header.value) {
          acc[header.name.toLowerCase()] = header.value;
        }
        return acc;
      },
      {}
    );

    const originalSubject = headerMap['subject'] || '';
    const originalFrom = headerMap['from'] || '';
    const originalTo = headerMap['to'] || '';
    const originalCc = headerMap['cc'] || '';
    const originalReplyTo = headerMap['reply-to'] || '';
    const originalMessageId = headerMap['message-id'] || '';
    const originalReferences = headerMap['references'] || '';

    const toRecipients: string[] = [];
    const ccRecipients: string[] = [];

    if (context.propsValue.reply_type === 'reply_all') {
      const senderEmail = originalReplyTo || originalFrom;
      if (senderEmail) {
        toRecipients.push(senderEmail);
      }

      const currentUserEmail = await getUserEmail(context.auth, authClient);

      if (originalTo) {
        const toEmails = originalTo.split(',').map((email) => email.trim());
        toRecipients.push(
          ...toEmails.filter((email) => !email.includes(currentUserEmail || ''))
        );
      }

      if (originalCc) {
        const ccEmails = originalCc.split(',').map((email) => email.trim());
        ccRecipients.push(
          ...ccEmails.filter((email) => !email.includes(currentUserEmail || ''))
        );
      }
    } else {
      const senderEmail = originalReplyTo || originalFrom;
      if (senderEmail) {
        toRecipients.push(senderEmail);
      }
    }

    let replySubject = originalSubject;
    if (!replySubject.toLowerCase().startsWith('re:')) {
      replySubject = `Re: ${replySubject}`;
    }

    let referencesHeader = originalMessageId;
    if (originalReferences) {
      referencesHeader = `${originalReferences} ${originalMessageId}`;
    }

    const senderEmail = await getUserEmail(context.auth, authClient);

    const subjectBase64 = Buffer.from(replySubject).toString('base64');
    const isPlainText = context.propsValue.body_type === 'plain_text';
    const mailOptions: Mail.Options = {
      to: toRecipients.join(', '),
      cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
      subject: `=?UTF-8?B?${subjectBase64}?=`,
      text: isPlainText ? context.propsValue.body : undefined,
      html: isPlainText ? undefined : context.propsValue.body,
      attachments: [],
      headers: [
        {
          key: 'In-Reply-To',
          value: originalMessageId,
        },
        {
          key: 'References',
          value: referencesHeader,
        },
      ],
    };

    if (senderEmail) {
      mailOptions.from = context.propsValue.sender_name
        ? `${context.propsValue.sender_name} <${senderEmail}>`
        : senderEmail;
    }

    if (context.propsValue.attachment) {
      const lookupResult = mime.lookup(
        context.propsValue.attachment.extension || ''
      );
      const attachmentOption: Attachment[] = [
        {
          filename:
            context.propsValue.attachment_name ??
            context.propsValue.attachment.filename,
          content: context.propsValue.attachment.base64,
          contentType: lookupResult || undefined,
          encoding: 'base64',
        },
      ];
      mailOptions.attachments = attachmentOption;
    }

    const mail: any = new MailComposer(mailOptions).compile();
    mail.keepBcc = true;
    const mailBody = await mail.build();

    const encodedPayload = Buffer.from(mailBody)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        threadId: originalMessage.data.threadId || undefined,
        raw: encodedPayload,
      },
    });

    return response.data;
  },
});
