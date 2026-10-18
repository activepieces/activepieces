import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { sendEmailOutputSchema } from '../output-schemas';

export const sendEmail = createAction({
  auth: resendAuth,
  name: 'send_email',
  classification: 'WRITE',
  displayName: 'Send Email',
  outputSchema: sendEmailOutputSchema,
  description: 'Send a plain-text or HTML email.',
  audience: 'both',
  aiMetadata: { description: 'Sends a single transactional email (plain text or HTML) to one or more recipients via Resend. Use this for one-off messages; the sender address must be on a domain you have verified in Resend. Not idempotent — each call sends a new email.', idempotent: false },
  propertyGroups: [
    {
      key: 'recipients',
      display: 'tabs',
      label: 'Recipients',
      description:
        'Press Enter after each address. Reply To receives replies instead of the sender.',
      props: ['to', 'cc', 'bcc', 'reply_to'],
    },
  ],
  props: {
    from_name: Property.ShortText({
      displayName: 'Sender Name',
      description: 'Name shown in the inbox instead of your address.',
      placeholder: 'Jane at Acme',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Must be an address on a domain you verified in Resend.',
      placeholder: 'jane@acme.com',
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
    reply_to: Property.ShortText({
      displayName: 'Reply To',
      description: 'Replies go to this address instead of the sender.',
      placeholder: 'support@acme.com',
      required: false,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      placeholder: 'Your March invoice',
      required: true,
    }),
    content_type: Property.Dropdown<'text' | 'html', true, typeof resendAuth>({
      auth: resendAuth,
      displayName: 'Body Type',
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
      displayName: 'Body',
      description: 'Write HTML markup when Body Type is HTML.',
      placeholder: 'Hi Jane, thanks for signing up.',
      required: true,
    }),
  },
  async run(context) {
    const {
      to,
      from,
      from_name,
      reply_to,
      subject,
      content_type,
      content,
      cc,
      bcc,
    } = context.propsValue;
    const requestBody: Record<string, unknown> = {
      to,
      from: from_name ? `${from_name} <${from}>` : from,
      reply_to: reply_to || from,
      cc,
      bcc,
      subject: subject,
    };
    if (content_type === 'text') {
      requestBody['text'] = content;
    } else if (content_type === 'html') {
      requestBody['html'] = content;
    }
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.resend.com/emails`,
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams: {},
    });
  },
});
