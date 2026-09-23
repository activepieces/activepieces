import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import mime from 'mime-types';
import MailComposer from 'nodemailer/lib/mail-composer';
import Mail, { Attachment } from 'nodemailer/lib/mailer';
import { gmailAuth, createGoogleClient, getUserEmail } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { sendEmailActionOutputSchema } from '../output-schemas';

export const gmailSendEmailAction = createAction({
  auth: gmailAuth,
  name: 'send_email',
  classification: 'WRITE',
  description: 'Send an email through a Gmail account',
  audience: 'human',
  aiMetadata: {
    description:
      'Composes and sends a new email from the connected Gmail account to one or more recipients, with optional CC/BCC, attachments, and plain-text or HTML body. Use this to originate a fresh message; to answer an existing thread prefer Reply to Email instead, or pass an original Message-ID to send this message into that existing thread. Set the draft flag to save it as a draft instead of sending. Not idempotent: each call sends (or drafts) a separate message.',
    idempotent: false,
  },
  displayName: 'Send Email',
  props: {
    receiver: Property.Array({
      displayName: 'To',
      description: 'One address per row.',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'Cc',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'Bcc',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: undefined,
      placeholder: 'Invoice for March',
      required: true,
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
            label: 'HTML',
            value: 'html',
            description: 'Tags are rendered',
            icon: 'code',
          },
        ],
      },
    }),
    body: Property.ShortText({
      displayName: 'Body',
      required: true,
    }),
    reply_to: Property.Array({
      displayName: 'Reply To',
      description: 'Replies go to these addresses instead of the sender.',
      required: false,
    }),
    sender_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name shown in the inbox instead of your address.',
      placeholder: 'Jane at Acme',
      required: false,
      advanced: true,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'A send-as address already set up in your Gmail settings.',
      placeholder: 'sales@example.com',
      required: false,
      advanced: true,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Attachment Name',
          description: 'Overrides the uploaded file name.',
          placeholder: 'report.pdf',
          required: false,
        }),
      },
    }),
    in_reply_to: Property.ShortText({
      displayName: 'In Reply To',
      description: 'Message-ID header of the email to thread this under.',
      required: false,
      advanced: true,
    }),
    draft: Property.Checkbox({
      displayName: 'Save as Draft',
      description: 'Save to Drafts instead of sending.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: sendEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);

    const gmail = googleGmail({ version: 'v1', auth: authClient });

    const subjectBase64 = Buffer.from(context.propsValue['subject']).toString(
      'base64'
    );
    const attachments = context.propsValue.attachments as {
      file: ApFile;
      name: string | undefined;
    }[];
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
          ? context.propsValue['body']
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
      threadId = messages.data.messages?.[0]?.threadId;
    }

    const senderEmail =
      context.propsValue.from || (await getUserEmail(context.auth, authClient));
    if (senderEmail) {
      mailOptions.from = context.propsValue.sender_name
        ? `${context.propsValue['sender_name']} <${senderEmail}>`
        : senderEmail;
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
