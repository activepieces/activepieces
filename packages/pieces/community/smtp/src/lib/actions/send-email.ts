import { Property, createAction } from '@activepieces/pieces-framework';
import { smtpAuth } from '../..';
import { smtpCommon } from '../common';
import { Attachment } from 'nodemailer/lib/mailer';
import mime from 'mime-types';

export const sendEmail = createAction({
  auth: smtpAuth,
  name: 'send-email',
  displayName: 'Send Email',
  description: 'Send an email using a custom SMTP server.',
  props: {
    from: Property.ShortText({
      displayName: 'From',
      required: true,
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
  },
  run: async ({ auth, propsValue }) => {
    const transporter = smtpCommon.createSMTPTransport(auth);

    const attachment = propsValue['attachment'];

    let attachment_data: Attachment[] = [];

    if (attachment) {
      const lookupResult = mime.lookup(
        attachment.extension ? attachment.extension : ''
      );
      const attachmentOption: Attachment[] = [
        {
          filename: propsValue.attachment_name ?? attachment.filename,
          content: attachment?.base64,
          contentType: lookupResult ? lookupResult : undefined,
          encoding: 'base64',
        },
      ];
      attachment_data = attachmentOption;
    }

    const info = await transporter.sendMail({
      from: propsValue.from,
      to: propsValue.to.join(','),
      cc: propsValue.cc?.join(','),
      inReplyTo: propsValue.replyTo,
      bcc: propsValue.bcc?.join(','),
      subject: propsValue.subject,
      text: propsValue.body_type === 'plain_text' ? propsValue.body : undefined,
      html: propsValue.body_type === 'html' ? propsValue.body : undefined,
      attachments: attachment ? attachment_data : undefined,
    });

    return info;
  },
});
