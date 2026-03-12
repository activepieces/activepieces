import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { predisAiAuth } from '../..';

export const postCreated = createTrigger({
  auth: predisAiAuth,
  name: 'post_created',
  displayName: 'Post Created',
  description: 'Triggers when a post generation completes or fails.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    markdown: Property.MarkDown({
      value: `## Predis.ai Webhook Setup
To use this trigger, configure the webhook URL in your Predis.ai account:

1. Login to Predis.ai
2. Navigate to **Pricing & Account** → **Rest API**
3. Add the following webhook URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
4. Save your changes

The webhook will fire when posts reach **completed** or **error** status.`,
    }),
  },
  async onEnable() {
    // Webhook is configured manually in Predis.ai dashboard
  },
  async onDisable() {
    // Webhook is removed manually in Predis.ai dashboard
  },
  async run(context) {
    const payload = context.payload.body as Record<string, unknown>;
    return [payload];
  },
  async test() {
    return [
      {
        status: 'completed',
        caption: 'Sample caption for your post',
        post_id: 'sample_post_id_123',
        generated_media: [{ url: 'https://example.com/media.png' }],
        brand_id: 'sample_brand_id',
      },
    ];
  },
  sampleData: {
    status: 'completed',
    caption: 'Sample caption for your post',
    post_id: 'sample_post_id_123',
    generated_media: [{ url: 'https://example.com/media.png' }],
    brand_id: 'sample_brand_id',
  },
});
