
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import crypto from 'crypto';
export const newTranscriptionComplete = createTrigger({
  name: 'newTranscriptionComplete',
  displayName: 'New Transcription Complete',
  description:
    'Start a workflow when a new meeting is transcribed (e.g., push summary to Slack or update CRM).',
  props: {
    webhookSecretKey: Property.ShortText({
      displayName: 'Webhook Secret Key',
      description: 'The secret key used to verify the webhook',
      required: false,
    }),
  },
  sampleData: {
    meetingId: 'ASxwZxCstx',
    eventType: 'Transcription completed',
    clientReferenceId: 'be582c46-4ac9-4565-9ba6-6ab4264496a8',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable({ webhookUrl, propsValue, store }) {
    if (propsValue.webhookSecretKey) {
      await store.put<string>('webhookSecretKey', propsValue.webhookSecretKey);
    }

    console.log('[FIREFILES_AI] Webhook enabled. Webhook URL: ' + webhookUrl);
  },
  async onDisable({ store, webhookUrl }) {
    await store.delete('webhookSecretKey');
    console.log('[FIREFILES_AI] Webhook disabled. Webhook URL:' + webhookUrl);
  },
  async run({store, payload}) {
    const webhookSecretKey = await store.get<string>('webhookSecretKey');
    const hmacSignature = payload.headers['x-hub-signature'];

    if (webhookSecretKey) {
        if (!hmacSignature) {
            console.log('[FIREFILES_AI] Webhook signature verification failed.');
            return [];
        }

        const body = JSON.stringify(payload.body);
        const hmac = crypto.createHmac('sha256', webhookSecretKey);
        const digest = 'sha256=' + hmac.update(body).digest('hex');

        if (digest !== hmacSignature) {
            console.log('[FIREFILES_AI] Webhook signature verification failed.');
            return [];
        }
    }

    return [payload.body];
  },
});