import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailCreateDraftReplyAction = createAction({
  auth: gmailAuth,
  name: 'create_draft_reply',
  description: 'Create a draft reply within an existing thread',
  displayName: 'Create Draft Reply',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message you want to reply to',
      required: true,
    }),
    body_type: Property.StaticDropdown({
      displayName: 'Body Type',
      required: true,
      defaultValue: 'plain_text',
      options: {
        disabled: false,
        options: [
          {
            label: 'plain text',
            value: 'plain_text',
          },
          {
            label: 'html',
            value: 'html',
          },
        ],
      },
    }),
    body: Property.ShortText({
      displayName: 'Body',
      description: 'Body for the draft reply you want to create',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC Email',
      description: undefined,
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC Email',
      description: undefined,
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'File to attach to the draft reply.',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Attachment Name',
          description: 'In case you want to change the name of the attachment.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    // Get the original message to extract thread info and headers
    const originalMessage = await gmail.users.messages.get({
      userId: 'me',
      id: context.propsValue.message_id,
      format: 'metadata',
      metadataHeaders: ['Message-ID', 'Subject', 'From', 'To'],
    });

    const headers = originalMessage.data.payload?.headers || [];
    const messageIdHeader = headers.find((h) => h.name === 'Message-ID');
    const subjectHeader = headers.find((h) => h.name === 'Subject');
    const fromHeader = headers.find((h) => h.name === 'From');

    const threadId = originalMessage.data.threadId;
    const originalMessageId = messageIdHeader?.value || '';
    let subject = subjectHeader?.value || '';

    // Add "Re: " prefix if not already present
    if (subject && !subject.toLowerCase().startsWith('re:')) {
      subject = `Re: ${subject}`;
    }

    // Extract email from From header for the To field
    const replyTo = fromHeader?.value || '';

    const subjectBase64 = Buffer.from(subject).toString('base64');
    const attachments = context.propsValue.attachments as {
      file: ApFile;
      name: string | undefined;
    }[];
    const cc = context.propsValue['cc']?.filter((email) => email !== '');
    const bcc = context.propsValue['bcc']?.filter((email) => email !== '');

    const mailOptions: Mail.Options = {
      to: replyTo,
      cc: cc ? cc.join(', ') : undefined,
      bcc: bcc ? bcc.join(', ') : undefined,
      subject: `=?UTF-8?B?${subjectBase64}?=`,
      text:
        context.propsValue.body_type === 'plain_text'
          ? context.propsValue['body']
          : undefined,
      html:
        context.propsValue.body_type === 'html'
          ? context.propsValue['body']
          : undefined,
      attachments: [],
      headers: [
        {
          key: 'References',
          value: originalMessageId,
        },
        {
          key: 'In-Reply-To',
          value: originalMessageId,
        },
      ],
    };

    const senderEmail = (
      await google.oauth2({ version: 'v2', auth: authClient }).userinfo.get()
    ).data.email;

    if (senderEmail) {
      mailOptions.from = senderEmail;
    }

    if (attachments && attachments.length > 0) {
      const attachmentOption: Attachment[] = attachments.map(
        ({ file, name }) => {
          const lookupResult = mime.lookup(
            file.extension ? file.extension : ''
          );
          return {
            filename: name ?? file.filename,
            content: file?.base64,
            contentType: lookupResult ? lookupResult : undefined,
            encoding: 'base64',
          };
        }
      );

      mailOptions.attachments = attachmentOption;
    }

    const mail: any = new MailComposer(mailOptions).compile();
    mail.keepBcc = true;
    const mailBody = await mail.build();

    const encodedPayload = Buffer.from(mailBody)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return await gmail.users.drafts.create({
      userId: 'me',
      requestBody: { message: { threadId, raw: encodedPayload } },
    });
  },
});
