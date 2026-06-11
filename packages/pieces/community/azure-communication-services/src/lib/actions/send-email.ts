import { createAction, Property } from '@activepieces/pieces-framework';
import { azureCommunicationServiceAuth } from '../..';
import { EmailClient, EmailMessage } from '@azure/communication-email';

export const sendEmail = createAction({
  auth: azureCommunicationServiceAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Send a text or HTML email',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends an email through Azure Communication Services from a verified sender address, supporting either plain-text or HTML body via the content type selector. Use to deliver transactional or notification email when the workflow is wired to an Azure Communication Services connection. Requires a sender address provisioned in the Azure resource and at least one recipient; not idempotent — each call dispatches a new message.',
    idempotent: false,
  },
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
    content_type: Property.Dropdown<'text' | 'html', true, typeof azureCommunicationServiceAuth>({
      auth: azureCommunicationServiceAuth,
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
    const client = new EmailClient(context.auth.secret_text);
    const poller = await client.beginSend(message);
    return await poller.pollUntilDone();
  },
});
