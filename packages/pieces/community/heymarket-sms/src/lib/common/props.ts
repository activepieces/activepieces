import { Property } from '@activepieces/pieces-framework';

export const instructionProp = Property.MarkDown({
  value: `
## Webhook Setup Instructions

To enable this trigger, you need to set up a webhook in your Heymarket account:

### Your Webhook URL

Copy the URL below and add it to your Heymarket webhook configuration:

\`\`\`
{{webhookUrl}}
\`\`\`

### How to Set Up

1. **Copy your webhook URL** - Use the URL above provided by the platform.

2. **Configure in Heymarket** - Navigate to [Heymarket Admin Integration Settings](https://app.heymarket.com/admin/integrations/api)

3. **Add the webhook URL** - Paste the webhook URL into the Webhook URL field and click **Add**

4. **Test the webhook** - Send a test message to your Heymarket inbox to verify the webhook is working
  `,
});
