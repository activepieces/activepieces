import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { resendAuth } from '../..';

const BASE_URL = 'https://api.resend.com';

export const sendBatchEmails = createAction({
  name: 'send_batch_emails',
  auth: resendAuth,
  displayName: 'Send Batch Emails',
  description: 'Send up to 100 emails in a single API call',
  props: {
    emails: Property.Array({
      displayName: 'Emails',
      description: 'List of emails to send (max 100). Each email is sent independently with its own recipient, subject, and body.',
      required: true,
      properties: {
        from: Property.ShortText({
          displayName: 'From',
          description: 'Sender address. Use "Name <email@domain.com>" for a friendly name.',
          required: true,
        }),
        to: Property.ShortText({
          displayName: 'To',
          description: 'Recipient email address.',
          required: true,
        }),
        subject: Property.ShortText({
          displayName: 'Subject',
          required: true,
        }),
        content_type: Property.StaticDropdown({
          displayName: 'Content Type',
          required: true,
          options: {
            options: [
              { label: 'HTML', value: 'html' },
              { label: 'Plain Text', value: 'text' },
            ],
          },
        }),
        content: Property.LongText({
          displayName: 'Content',
          description: 'Email body. Use HTML markup if Content Type is HTML.',
          required: true,
        }),
        reply_to: Property.ShortText({
          displayName: 'Reply To',
          required: false,
        }),
        cc: Property.ShortText({
          displayName: 'CC',
          required: false,
        }),
        bcc: Property.ShortText({
          displayName: 'BCC',
          required: false,
        }),
      },
    }),
    idempotency_key: Property.ShortText({
      displayName: 'Idempotency Key',
      description:
        'Optional unique key to prevent duplicate sends. Must be unique per request, expires after 24 hours, max 256 characters.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const batch = (propsValue.emails ?? []).map((item) => {
      const email = item as Record<string, unknown>;
      const payload: Record<string, unknown> = {
        from: email['from'],
        to: email['to'],
        subject: email['subject'],
      };
      if (email['content_type'] === 'html') {
        payload['html'] = email['content'];
      } else {
        payload['text'] = email['content'];
      }
      if (email['reply_to']) payload['reply_to'] = email['reply_to'];
      if (email['cc']) payload['cc'] = email['cc'];
      if (email['bcc']) payload['bcc'] = email['bcc'];
      return payload;
    });

    const extraHeaders: Record<string, string> = {};
    if (propsValue.idempotency_key) {
      extraHeaders['Idempotency-Key'] = propsValue.idempotency_key;
    }

    const response = await httpClient.sendRequest<{ data: { id: string }[] }>({
      method: HttpMethod.POST,
      url: `${BASE_URL}/emails/batch`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.secret_text,
      },
      headers: extraHeaders,
      body: batch,
    });

    return response.body.data;
  },
});
