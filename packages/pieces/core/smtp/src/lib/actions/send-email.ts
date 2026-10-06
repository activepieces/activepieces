import { ApFile, Property, createAction } from '@activepieces/pieces-framework';
import { smtpAuth } from '../..';
import { smtpCommon } from '../common';
import Mail from 'nodemailer/lib/mailer';
import mime from 'mime-types';
import { sendEmailActionOutputSchema } from '../output-schemas';

export const sendEmail = createAction({
  audience: 'both',
  auth: smtpAuth,
  name: 'send-email',
  classification: 'WRITE',
  displayName: 'Send Email',
  description: 'Send an email using a custom SMTP server.',
  aiMetadata: { description: 'Sends an email through an arbitrary SMTP relay, delivering the body as either plain text or HTML depending on the chosen body type. Use this when the only mail credentials available are raw SMTP host/port/login details; prefer a provider-specific piece (Gmail, Microsoft Outlook, SendGrid) when the mailbox lives on one of those services. Requires a reachable SMTP connection, a from address, at least one recipient, a subject and a body; not idempotent, since each call sends another copy.', idempotent: false },
  propertyGroups: [
    {
      key: 'recipients',
      display: 'tabs',
      label: 'Recipients',
      props: ['to', 'cc', 'bcc', 'replyTo'],
    },
  ],
  props: {
    from: Property.ShortText({
      displayName: 'From Email',
      description: 'Must be an address your server lets you send from.',
      placeholder: 'sender@example.com',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
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
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      description: 'Replies go to this address instead of the sender.',
      placeholder: 'support@example.com',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
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
            icon: 'text',
          },
          {
            label: 'HTML',
            value: 'html',
            icon: 'code',
          },
        ],
      },
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: true,
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
      }
    }),
    senderName: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name shown in the inbox instead of your address.',
      placeholder: 'Jane at Acme',
      required: false,
      advanced: true,
    }),
    customHeaders: Property.Object({
      displayName: 'Custom Headers',
      description: 'Extra headers added to the email, as name and value pairs.',
      required: false,
      advanced: true,
    }),
  },
  outputSchema: sendEmailActionOutputSchema,
  run: async ({ auth, propsValue }) => {
    const transporter = smtpCommon.createSMTPTransport(auth.props);

    const attachments = (propsValue.attachments ?? []) as {file: ApFile; name: string | undefined; }[];

    const attachment_data: Mail.Attachment[] = attachments.map(({file, name}) => {
      const lookupResult = mime.lookup(
        file.extension ? file.extension : ''
      );
      return {
        filename: name ?? file.filename,
        content: file?.base64,
        contentType: lookupResult ? lookupResult : undefined,
        encoding: 'base64',
      };
    });

    const mailOptions = {
      from: getFrom(propsValue.senderName, propsValue.from),
      to: propsValue.to.join(','),
      cc: propsValue.cc?.join(','),
      replyTo: propsValue.replyTo,
      bcc: propsValue.bcc?.join(','),
      subject: propsValue.subject,
      text: propsValue.body_type === 'plain_text' ? propsValue.body : undefined,
      html: propsValue.body_type === 'html' ? propsValue.body : undefined,
      attachments: attachment_data ? attachment_data : undefined,
      headers: propsValue.customHeaders as Mail.Headers,
    };

    return await sendWithRetry(transporter, mailOptions);
  },
});

async function sendWithRetry(transporter: any, mailOptions: any) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error: any) {
      if ('code' in error && error.code === 'ECONNRESET' && retryCount < maxRetries - 1) {
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      throw error;
    }
  }
}

function getFrom(senderName: string|undefined, from: string) {
  if (senderName) {
    return `"${senderName}" <${from}>`
  }
  return from;
}
