import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { resendAuth } from '../..';
import { resendClient } from '../common/client';
import { sendBatchEmailsOutputSchema } from '../output-schemas';

export const sendBatchEmails = createAction({
  name: 'send_batch_emails',
  classification: 'WRITE',
  auth: resendAuth,
  displayName: 'Send Batch Emails',
  outputSchema: sendBatchEmailsOutputSchema,
  description: 'Send up to 100 emails in a single API call',
  audience: 'both',
  aiMetadata: { description: 'Sends up to 100 distinct emails in one Resend API call, each with its own recipient, subject, and body. Use this instead of Send Email when delivering many independent messages at once. Senders must be on verified domains; pass an idempotency key to guard against duplicate batch sends, otherwise each call sends new emails.', idempotent: false },
  props: {
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Up to 100 emails, each with its own sender, recipient and body.',
      required: true,
      properties: {
        from: Property.ShortText({
          displayName: 'From',
          description: 'Must be on a verified domain. Use Name <email> to show a name.',
          placeholder: 'Acme <hello@acme.com>',
          required: true,
        }),
        to: Property.ShortText({
          displayName: 'To',
          placeholder: 'jane@example.com',
          required: true,
        }),
        subject: Property.ShortText({
          displayName: 'Subject',
          placeholder: 'Your March invoice',
          required: true,
        }),
        content_type: Property.StaticDropdown({
          displayName: 'Body Type',
          required: true,
          display: 'cards',
          options: {
            options: [
              { label: 'Plain Text', value: 'text', icon: 'text' },
              { label: 'HTML', value: 'html', icon: 'code' },
            ],
          },
        }),
        content: Property.LongText({
          displayName: 'Body',
          description: 'Write HTML markup when Body Type is HTML.',
          placeholder: 'Hi Jane, thanks for signing up.',
          required: true,
        }),
        reply_to: Property.ShortText({
          displayName: 'Reply To',
          placeholder: 'support@acme.com',
          required: false,
        }),
        cc: Property.ShortText({
          displayName: 'Cc',
          placeholder: 'jane@example.com',
          required: false,
        }),
        bcc: Property.ShortText({
          displayName: 'Bcc',
          placeholder: 'jane@example.com',
          required: false,
        }),
      },
    }),
    idempotency_key: Property.ShortText({
      displayName: 'Deduplication Key',
      description:
        'A repeat batch with the same key within 24 hours is not sent again.',
      placeholder: 'order-1042-receipts',
      required: false,
      advanced: true,
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

    const response = await resendClient.sendRequest<{ data: { id: string }[] }>({
      auth: auth.secret_text,
      method: HttpMethod.POST,
      path: '/emails/batch',
      headers: extraHeaders,
      body: batch,
    });

    return response.data;
  },
});
