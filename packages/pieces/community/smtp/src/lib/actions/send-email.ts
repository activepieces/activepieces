import { ApFile, Property, createAction } from '@activepieces/pieces-framework';
import { smtpAuth } from '../..';
import { smtpCommon } from '../common';
import { Attachment, Headers } from 'nodemailer/lib/mailer';
import mime from 'mime-types';

export const sendEmail = createAction({
  auth: smtpAuth,
  name: 'send-email',
  displayName: 'Send Email',
  description: 'Send an email using a custom SMTP server.',
  props: {
    from: Property.ShortText({
      displayName: 'From Email',
      required: true,
    }),
    senderName: Property.ShortText({
      displayName: "Sender Name",
      required: false,
    }),
    to: Property.Array({
      displayName: 'To',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'CC',
      required: false,
    }),
    replyTo: Property.ShortText({
      displayName: 'Reply To',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'BCC',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
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
    body: Property.LongText({
      displayName: 'Body',
      required: true,
    }),
    customHeaders: Property.Object({
      displayName: 'Custom Headers',
      required: false,
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        file: Property.File({
          displayName: 'File',
          description: 'File to attach to the email you want to send',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Attachment Name',
          description: 'In case you want to change the name of the attachment',
          required: false,
        }),
      }
    }),
  },
  run: async ({ auth, propsValue }) => {
    const transporter = smtpCommon.createSMTPTransport(auth);

    const attachments = propsValue['attachments'] as {file: ApFile; name: string | undefined; }[];

    const attachment_data: Attachment[] = attachments.map(({file, name}) => {
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
      inReplyTo: propsValue.replyTo,
      bcc: propsValue.bcc?.join(','),
      subject: propsValue.subject,
      text: propsValue.body_type === 'plain_text' ? propsValue.body : undefined,
      html: propsValue.body_type === 'html' ? propsValue.body : undefined,
      attachments: attachment_data ? attachment_data : undefined,
      headers: propsValue.customHeaders as Headers,
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
