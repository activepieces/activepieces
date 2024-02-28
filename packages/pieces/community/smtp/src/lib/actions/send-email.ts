import { Property, createAction } from '@activepieces/pieces-framework';
import { smtpAuth } from '../..';
import { smtpCommon } from '../common';

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
    const transporter = smtpCommon.createSMTPTransport(auth);
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
