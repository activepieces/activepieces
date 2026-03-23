import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { meetgeekaiAuth } from '../common/auth';
export const newMeeting = createTrigger({
  auth: meetgeekaiAuth,
  name: 'newMeeting',
  displayName: 'New Meeting',
  description: `Triggers when a meeting analysis is completed and highlights are available.
`,
  props: {
    instruction: Property.MarkDown({
      value: `## Configuration

To set up this webhook trigger:

1. **Copy the Webhook URL** displayed below:
\`\`\`text
{{webhookUrl}}
\`\`\`

2. Navigate to [MeetGeek Integrations Page](https://app.meetgeek.ai/integrations)
3. Open the **Public API** section
4. Paste the webhook URL into the **Webhook URL** field
5. Click **Save** to activate the webhook`,
    }),
  },
  sampleData: {
    meeting_id: '99e727a1-fd4b-4526-9cfb-3a8a0bdffeb7',
    message: 'File analyzed successfully',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // MeetGeek uses manual webhook configuration
  },
  async onDisable(context) {
    // Clean up stored webhook URL
  },
  async run(context) {
    return [context.payload.body];
  },
});
