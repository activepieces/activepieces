import { createAction, Property } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailProps } from '../common/props';

export const gmailCreateDraftReplyAction = createAction({
  auth: gmailAuth,
  name: 'create_draft_reply',
  description: 'Creates a draft reply to an existing email.',
  displayName: 'Create Draft Reply',
  props: {
    message_id: GmailProps.message,
    reply_type: Property.StaticDropdown({
      displayName: 'Reply Type',
      description:
        'Choose whether to reply to sender only or to all recipients',
      required: true,
      defaultValue: 'reply',
      options: {
        disabled: false,
        options: [
          {
            label: 'Reply (to sender only)',
            value: 'reply',
          },
          {
            label: 'Reply All (to all recipients)',
            value: 'reply_all',
          },
        ],
      },
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: true,
      defaultValue: 'plain_text',
      options: {
        disabled: false,
        options: [
          {
            label: 'Plain text',
            value: 'plain_text',
          },
          {
            label: 'HTML',
            value: 'html',
          },
        ],
      },
    }),
    body: Property.LongText({
      displayName: 'Draft Reply Body',
      description: 'Your draft reply message content',
      required: false,
    }),
    include_original_message: Property.Checkbox({
      displayName: 'Include Original Message',
      description: 'Include the original message content in the draft reply',
      required: true,
      defaultValue: true,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Optional sender name to display',
      required: false,
    }),
    attachment: Property.File({
      displayName: 'Attachment',
      description: 'Optional file to attach to your draft reply',
      required: false,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Custom name for the attachment',
      required: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

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
    const originalDate = headerMap['date'] || '';

    let originalMessageContent = '';
    if (context.propsValue.include_original_message) {
      try {
        const { parseStream } = await import('../common/data');

        const originalMessageFull = await gmail.users.messages.get({
          userId: 'me',
          id: context.propsValue.message_id,
          format: 'raw',
        });

        if (originalMessageFull.data.raw) {
          const rawMessage = Buffer.from(
            originalMessageFull.data.raw,
            'base64'
          ).toString('utf-8');
          const parsedMessage = await parseStream(rawMessage);

          let messageText = parsedMessage.text || '';
          if (!messageText && parsedMessage.html) {
            messageText = parsedMessage.html
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
          }

          if (messageText) {
            const quotedLines = messageText
              .split('\n')
              .map((line) => `> ${line.trim()}`);
            const senderInfo = `On ${originalDate}, ${originalFrom} wrote:`;
            originalMessageContent = `${senderInfo}\n${quotedLines.join('\n')}`;
          }
        }
      } catch (error) {
        console.warn(
          'Could not extract original message content for quoting:',
          error
        );
        originalMessageContent = `On ${originalDate}, ${originalFrom} wrote:\n> [Original message content could not be parsed]`;
      }
    }

    const toRecipients: string[] = [];
    const ccRecipients: string[] = [];

    if (context.propsValue.reply_type === 'reply_all') {
      const senderEmail = originalReplyTo || originalFrom;
      if (senderEmail) {
        toRecipients.push(senderEmail);
      }

      const currentUserEmail = (
        await google.oauth2({ version: 'v2', auth: authClient }).userinfo.get()
      ).data.email;

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

    const senderEmail = (
      await google.oauth2({ version: 'v2', auth: authClient }).userinfo.get()
    ).data.email;

    let draftBody = context.propsValue.body || '';

    if (context.propsValue.include_original_message && originalMessageContent) {
      const separator =
        context.propsValue.body_type === 'html'
          ? '<br><br>--- Original Message ---<br>'
          : '\n\n--- Original Message ---\n';

      const quotedContent =
        context.propsValue.body_type === 'html'
          ? originalMessageContent.replace(/\n/g, '<br>')
          : originalMessageContent;

      draftBody = draftBody
        ? `${draftBody}${separator}${quotedContent}`
        : quotedContent;
    }

    const subjectBase64 = Buffer.from(replySubject).toString('base64');
    const mailOptions: Mail.Options = {
      to: toRecipients.join(', '),
      cc: ccRecipients.length > 0 ? ccRecipients.join(', ') : undefined,
      subject: `=?UTF-8?B?${subjectBase64}?=`,
      text:
        context.propsValue.body_type === 'plain_text' ? draftBody : undefined,
      html: context.propsValue.body_type === 'html' ? draftBody : undefined,
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

    const draft = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          threadId: originalMessage.data.threadId || undefined,
          raw: encodedPayload,
        },
      },
    });

    return {
      ...draft.data,
      originalMessage: {
        id: context.propsValue.message_id,
        subject: originalSubject,
        from: originalFrom,
        to: originalTo,
        date: originalDate,
        threadId: originalMessage.data.threadId,
      },
      draftDetails: {
        replyType: context.propsValue.reply_type,
        recipients: {
          to: toRecipients,
          cc: ccRecipients,
        },
        subject: replySubject,
        includeOriginal: context.propsValue.include_original_message,
      },
    };
  },
});
