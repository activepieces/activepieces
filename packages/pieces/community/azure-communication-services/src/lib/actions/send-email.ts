import { createAction, Property } from '@activepieces/pieces-framework';
import { azureCommunicationServiceAuth } from '../..';
import { EmailClient, EmailMessage } from '@azure/communication-email';

export const sendEmail = createAction({
  auth: azureCommunicationServiceAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a text or HTML email',
  props: {
    from: Property.ShortText({
      displayName: 'Sender Email (From)',
      description: 'Sender email',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      description: 'Emails of the recipients',
      required: true,
    }),
    cc: Property.Array({
      displayName: 'Cc',
      description: 'List of emails in cc',
      required: false,
    }),
    bcc: Property.Array({
      displayName: 'Bcc',
      description: 'List of emails in bcc',
      required: false,
    }),
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Email to receive replies on (defaults to sender)',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: undefined,
      required: true,
    }),
    content_type: Property.Dropdown<'text' | 'html'>({
      displayName: 'Content Type',
      refreshers: [],
      required: true,
      defaultValue: 'html',
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Plain Text', value: 'text' },
            { label: 'HTML', value: 'html' },
          ],
        };
      },
    }),
    content: Property.ShortText({
      displayName: 'Content',
      description: 'HTML is only allowed if you selected HTML as type',
      required: true,
    }),
  },
  async run(context) {
    const { to, from, reply_to, subject, content_type, content, cc, bcc } =
      context.propsValue;
    const message = {
      senderAddress: from,
      content: {
        subject: subject,
        ...(content_type === 'text' && { plainText: content }),
        ...(content_type === 'html' && { html: content }),
      },
      replyTo: [
        {
          address: reply_to ?? from,
        },
      ],
      recipients: {
        to: to.map((address) => ({ address })),
        cc: (cc || []).map((address) => ({ address })),
        bcc: (bcc || []).map((address) => ({ address })),
      },
    } as EmailMessage;
    const client = new EmailClient(context.auth);
    const poller = await client.beginSend(message);
    return await poller.pollUntilDone();
  },
});
