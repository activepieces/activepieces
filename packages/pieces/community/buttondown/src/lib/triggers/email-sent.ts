import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownRequest } from '../common/client';
import { createButtondownWebhookTrigger } from '../common/webhook';
import { ButtondownEmail } from '../common/types';

export const buttondownEmailSent = createButtondownWebhookTrigger({
  name: 'buttondown_email_sent',
  displayName: 'Email Sent',
  description: 'Triggers when an email is sent from Buttondown.',
  eventType: 'email.sent',
  sampleData: {
    event_type: 'email.sent',
    data: {
      email: 'eml_123456789',
    },
  },
  enrich: async ({ apiKey, payload }) => {
    const emailData = payload.data?.['email'];
    let email: ButtondownEmail | undefined;

    if (typeof emailData === 'string') {
      email = await buttondownRequest<ButtondownEmail>({
        auth: apiKey,
        method: HttpMethod.GET,
        path: `/emails/${encodeURIComponent(emailData)}`,
      });
    } else if (emailData && typeof emailData === 'object') {
      email = emailData as ButtondownEmail;
    }

    return {
      email,
    };
  },
});
