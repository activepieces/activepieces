import {
  createTrigger,
  MarkdownVariant,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';

export const omieWebhook = createTrigger({
  auth: omieAuth,
  name: 'omie_webhook',
  classification: 'READ',
  displayName: 'Omie Webhook Event',
  description: 'Triggers when Omie sends a webhook event. The webhook must be set up in Omie first.',
  aiMetadata: {
    description:
      'Fires once per event Omie posts to the webhook URL, optionally limited to one topic. Omie webhooks can only be created in the Omie developer portal, not through the API.',
  },
  props: {
    instructions: Property.MarkDown({
      value: `
1. Open your app in the [Omie Developer Portal](https://developer.omie.com.br) and go to its **Webhooks** settings.
2. Paste the following URL as the webhook address:
\`\`\`text
{{webhookUrl}}
\`\`\`
3. Select the events you want to receive and save.`,
      variant: MarkdownVariant.INFO,
    }),
    topic: Property.ShortText({
      displayName: 'Topic',
      description:
        'Only run for this event topic, e.g. "ClienteFornecedor.Incluido". Leave empty to receive every event Omie sends.',
      required: false,
    }),
  },
  sampleData: {
    messageId: 'a1b2c3d4-0000-0000-0000-000000000000',
    topic: 'ClienteFornecedor.Incluido',
    event: { codigo_cliente_omie: 12345, razao_social: 'Primeiro Cliente Ltda Me' },
    author: { email: 'user@example.com', name: 'Omie User', userId: 1 },
    appKey: '1234567890',
    origin: 'omie',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    return undefined;
  },
  async onDisable() {
    return undefined;
  },
  async run(context) {
    const body = omieClient.parseJsonObject({ value: context.payload.body });
    const { topic } = context.propsValue;
    if (topic && body['topic'] !== topic) return [];
    return [body];
  },
});
