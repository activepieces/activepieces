import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { dubAuth } from '../auth';

export const linkClicked = createTrigger({
  auth: dubAuth,
  name: 'link_clicked',
  displayName: 'Link Clicked',
  description:
    'Triggers in real time whenever one of your Dub short links is clicked.',
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
5. Under **Events**, select **link.clicked**.
6. Click **Create webhook**.`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    id: 'evt_abc123',
    event: 'link.clicked',
    createdAt: '2024-01-15T10:30:00.000Z',
    data: {
      link: {
        id: 'clv3g2xyz',
        domain: 'dub.sh',
        key: 'my-promo',
        url: 'https://example.com/landing',
        shortLink: 'https://dub.sh/my-promo',
        clicks: 42,
      },
      click: {
        id: 'click_abc',
        timestamp: '2024-01-15T10:30:00.000Z',
        identity: 'anonymous',
        url: 'https://dub.sh/my-promo',
        country: 'US',
        city: 'San Francisco',
        region: 'CA',
        continent: 'NA',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'macOS',
        referer: 'https://twitter.com',
        refererUrl: 'https://twitter.com',
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
