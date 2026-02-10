import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { orimonAuth } from '../common/auth';

export const newLead = createTrigger({
  auth: orimonAuth,
  name: 'newLead',
  displayName: 'New Lead',
  description: 'Trigger when a new lead is captured by your Orimon chatbot',
  props: {
    markdown: Property.MarkDown({
      value: `
## Webhook Configuration for Orimon

To enable this trigger, follow these steps to configure the webhook in your Orimon account:

### Step-by-Step Setup:

1. **Login to Orimon Dashboard** - [https://orimon.ai/login](https://orimon.ai/login).
2. **Go to Bot Overview**.
3. **Navigate to LeadFlow Integrations** - On the overview page, click on the **Settings** tab, then select **LeadFlow Integrations**
4. **Select Webhook** - Click on the "Webhook" option from the integrations page
5. **Paste the Webhook URL** - In the "Webhook URL" input field, paste the following URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
6. **Submit** - Click the "Submit" button to save the configuration    `,
    }),
  },
  sampleData: {
    email: 'test@test.com',
    host: 'channel-connector.orimon.ai',
    origin: 'https://bot.orimon.ai',
    referer:
      'https://bot.orimon.ai/deploy/index.html?tenantId=tenantId&testBot=true&defaultOpen=true',
    clientIp: '111.11.1.111',
    userIp: '111.11.1.111',
    userIpCity: 'Mumbai',
    userIpCountry: 'IN',
    platform_info: {
      description: 'Chrome 142.0.0.0 on Windows 10 64-bit',
      layout: 'Blink',
      manufacturer: null,
      name: 'Chrome',
      prerelease: null,
      product: null,
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      version: '142.0.0.0',
      os: {
        architecture: 64,
        family: 'Windows',
        version: '10',
      },
      device: 'Desktop',
      device_name: 'NA',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Note:
  },
  async onDisable(context) {
    // In
  },
  async run(context) {
    return [context.payload.body];
  },
});
