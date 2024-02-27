import { Property, createAction } from '@activepieces/pieces-framework';
import nodemailer from 'nodemailer';
import { smtpAuth } from '../..';

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
    body: Property.LongText({
      displayName: 'Body',
      required: true,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const transporter = nodemailer.createTransport({
      host: auth.host,
      port: auth.port,
      auth: {
        user: auth.email,
        pass: auth.password,
      },
      connectionTimeout: 10000, // 5 second timeout
      secure: auth.TLS === true ? true : undefined,
    });
    const info = await transporter.sendMail({
      from: propsValue.from,
      to: propsValue.to.join(','),
      cc: propsValue.cc?.join(','),
      inReplyTo: propsValue.replyTo,
      bcc: propsValue.bcc?.join(','),
      subject: propsValue.subject,
      text: propsValue.body,
    });

    return info;
  },
});
