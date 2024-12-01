import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailSendEmailAction = createAction({
  auth: gmailAuth,
  name: 'send_email',
  description: 'Send an email through a Gmail account',
  displayName: 'Send Email',
  props: {
    receiver: Property.Array({
      displayName: 'Receiver Email (To)',
      description: undefined,
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
    subject: Property.ShortText({
      displayName: 'Subject',
      description: undefined,
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
      description: 'Body for the email you want to send',
      required: true,
    }),
    reply_to: Property.Array({
      displayName: 'Reply-To Email',
      description: 'Email address to set as the "Reply-To" header',
      required: false,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email',
      description:
        "The address must be listed in your GMail account's settings",
      required: false,
    }),
    attachment: Property.File({
      displayName: 'Attachment',
      description: 'File to attach to the email you want to send',
      required: false,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'In case you want to change the name of the attachment',
      required: false,
    }),
    in_reply_to: Property.ShortText({
      displayName: 'In reply to',
      description: 'Reply to this Message-ID',
      required: false,
    }),
    draft: Property.Checkbox({
      displayName: 'Create draft',
      description: 'Create draft without sending the actual email',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const subjectBase64 = Buffer.from(context.propsValue['subject']).toString(
      'base64'
    );
    const attachment = context.propsValue['attachment'];
    const replyTo = context.propsValue['reply_to']?.filter(
      (email) => email !== ''
    );
    const receiver = context.propsValue['receiver']?.filter(
      (email) => email !== ''
    );
    const cc = context.propsValue['cc']?.filter((email) => email !== '');
    const bcc = context.propsValue['bcc']?.filter((email) => email !== '');
    const mailOptions: Mail.Options = {
      to: receiver.join(', '), // Join all email addresses with a comma
      cc: cc ? cc.join(', ') : undefined,
      bcc: bcc ? bcc.join(', ') : undefined,
      subject: `=?UTF-8?B?${subjectBase64}?=`,
      replyTo: replyTo ? replyTo.join(', ') : '',
      text:
        context.propsValue.body_type === 'plain_text'
          ? context.propsValue['body']
          : undefined,
      html:
        context.propsValue.body_type === 'html'
          ? context.propsValue['body'].replace(/\n/g, '<br>')
          : undefined,
      attachments: [],
    };
    let threadId = undefined;
    if (context.propsValue.in_reply_to) {
      mailOptions.headers = [
        {
          key: 'References',
          value: context.propsValue.in_reply_to,
        },
        {
          key: 'In-Reply-To',
          value: context.propsValue.in_reply_to,
        },
      ];
      const messages = await gmail.users.messages.list({
        userId: 'me',
        q: `Rfc822msgid:${context.propsValue.in_reply_to}`,
      });
      threadId = messages.data.messages?.[0].threadId;
    }

    const senderEmail =
      context.propsValue.from ||
      (await google.oauth2({ version: 'v2', auth: authClient }).userinfo.get())
        .data.email;
    if (senderEmail) {
      mailOptions.from = context.propsValue.sender_name
        ? `${context.propsValue['sender_name']} <${senderEmail}>`
        : senderEmail;
    }

    if (attachment) {
      const lookupResult = mime.lookup(
        attachment.extension ? attachment.extension : ''
      );
      const attachmentOption: Attachment[] = [
        {
          filename: context.propsValue.attachment_name ?? attachment.filename,
          content: attachment?.base64,
          contentType: lookupResult ? lookupResult : undefined,
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

    if (context.propsValue.draft) {
      return await gmail.users.drafts.create({
        userId: 'me',
        requestBody: { message: { threadId, raw: encodedPayload } },
      });
    } else {
      return await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          threadId,
          raw: encodedPayload,
        },
      });
    }
  },
});
