import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer';
import mime from 'mime-types';
import Mail from 'nodemailer/lib/mailer';
import { gmailAuth } from '../../';

export const gmailCreateDraftReplyAction = createAction({
  auth: gmailAuth,
  name: 'create_draft_reply',
  description: 'Create a draft reply within an existing thread',
  displayName: 'Create Draft Reply',
  props: {
    threadId: Property.ShortText({
      displayName: 'Thread ID',
      description: 'The ID of the thread you want to create a draft reply for',
      required: true,
    }),
    to: Property.Array({
      displayName: 'Receiver Email (To)',
      description: undefined,
      required: true,
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
          { label: 'plain text', value: 'plain_text' },
          { label: 'html', value: 'html' },
        ],
      },
    }),
    body: Property.ShortText({
      displayName: 'Body',
      description: 'Body of the email you want to draft as a reply',
      required: true,
    }),
    attachment: Property.File({
      displayName: 'Attachment',
      description: 'Optional file attachment for the draft reply',
      required: false,
    }),
    attachment_name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Optional name for the attachment',
      required: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const subjectBase64 = Buffer.from(context.propsValue['subject']).toString(
      'base64'
    );
    const to = context.propsValue['to']?.filter((email) => email !== '');
    const attachment = context.propsValue['attachment'];

    const mailOptions: Mail.Options = {
      to: to.join(', '),
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
    };

    if (attachment) {
      const lookupResult = mime.lookup(
        attachment.extension ? attachment.extension : ''
      );
      mailOptions.attachments = [
        {
          filename: context.propsValue.attachment_name ?? attachment.filename,
          content: attachment?.base64,
          contentType: lookupResult ? lookupResult : undefined,
          encoding: 'base64',
        },
      ];
    }

    const mail = new MailComposer(mailOptions).compile() as unknown as {
      keepBcc: boolean;
      build(): Promise<Buffer>;
    };
    mail.keepBcc = true;
    const mailBody = await mail.build();

    const encodedPayload = Buffer.from(mailBody)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          threadId: context.propsValue.threadId,
          raw: encodedPayload,
        },
      },
    });
  },
});
