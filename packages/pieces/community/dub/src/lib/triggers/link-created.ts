import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { dubAuth } from '../auth';

export const linkCreated = createTrigger({
  auth: dubAuth,
  name: 'link_created',
  displayName: 'Link Created',
  description: 'Triggers in real time whenever a new short link is created in your Dub workspace.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    md: Property.MarkDown({
      value: `## Setup Instructions

1. Go to your Dub workspace and navigate to **Settings → [Webhooks](https://app.dub.co/settings/webhooks)**.
2. Click **Create Webhook**.
3. Give your webhook a name.
4. Paste the following URL into the **URL** field:
\`\`\`text
{{webhookUrl}}
\`\`\`
5. Under **Events**, select **link.created**.
6. Click **Create webhook**.`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    id: 'evt_def456',
    event: 'link.created',
    createdAt: '2024-01-15T10:30:00.000Z',
    data: {
      link: {
        id: 'clv3g2xyz',
        domain: 'dub.sh',
        key: 'new-link',
        url: 'https://example.com/new-page',
        shortLink: 'https://dub.sh/new-link',
        clicks: 0,
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    },
  },
  async onEnable() {
    // Webhook is registered manually in the Dub platform
  },
  async onDisable() {
    // Webhook is removed manually in the Dub platform
  },
  async run(context) {
    return [context.payload.body];
  },
});
