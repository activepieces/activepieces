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

1. **Login to Orimon Dashboard** - Go to [https://orimon.ai/login](https://orimon.ai/login) and sign in with your Google account or manual credentials
2. **Go to Bot Overview** - Once logged in, you should see an icon for your bot. Click on it to go to the bot's overview page
3. **Navigate to LeadFlow Integrations** - On the overview page, click on the **Settings** tab, then select **LeadFlow Integrations**
4. **Select Webhook** - Click on the "Webhook" option from the integrations page
5. **Paste the Webhook URL** - In the "Webhook URL" input field, paste the following URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
6. **Verify the Connection** - Orimon will send a test POST request to verify the webhook endpoint. Make sure your server responds with a status code of 200
7. **Submit** - Click the "Submit" button to save the configuration    `,
    }),
  },
  sampleData: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    dynamicfield: {},
    userInfo: {},
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
