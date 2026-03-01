import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { openmicAiAuth } from '../common/auth';
import { MarkdownVariant } from '@activepieces/shared';

const webhookConfigDescription = `
## Post-call Webhook Configuration

### Steps to Configure in OpenMic AI:
1. Open your bot in OpenMic AI
2. Click on the **Post-Call** tab
3. Go to the **Webhook** section
4. In the **Post-Call Webhook URL** field, paste the URL below:

\`\`\`
{{webhookUrl}}
\`\`\`

5. Save your configuration

[Learn more about post-call webhooks](https://docs.openmic.ai/post-call-webhook)
`;

export const newPostCallSummary = createTrigger({
  auth: openmicAiAuth,
  name: 'newPostCallSummary',
  displayName: 'New Post-call Summary',
  description:
    'Trigger when a new call completes with comprehensive call data and analysis',
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: `

${webhookConfigDescription}`,
    }),
  },
  sampleData: {
    type: 'end-of-call-report',
    sessionId: 'cmdx5w8oc0005q671s3cbg063',
    toPhoneNumber: '+916297653534',
    fromPhoneNumber: '+16167948654',
    callDuration: '0:00:45.723362',
    callType: 'phonecall',
    disconnectionReason: 'user_ended_call',
    direction: 'outbound',
    createdAt: '2025-08-04T13:44:26.604Z',
    endedAt: '2025-08-04T13:45:03.325Z',
    callPickup: 'yes',
    sessionType: 'voice',
    transcript: [
      ['assistant', 'Hello I am Jay.'],
      ['user', 'Yeah. Hi.'],
      [
        'assistant',
        'Hey Soumyadip! Great to hear from you. How can I help you today? Want me to reserve some raisins for you?',
      ],
      ['user', 'Gotcha.'],
      [
        'assistant',
        "Awesome! I'll go ahead and reserve a pack of raisins for you at Shri Balaji Traders. Just let me know when you want to pick them up or if you'd like me to help with an online order. Cheers!",
      ],
    ],
    summary:
      'Jay greeted Soumyadip and offered to reserve a pack of raisins at Shri Balaji Traders. The conversation focused on confirming the reservation, with options for pickup or online order.',
    isSuccessful: false,
    successEvaluation: true,
    extractedData: {
      product: 'Raisins',
    },
    dynamicVariables: {
      customerName: 'Soumyadip Moni',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // implement webhook creation logic
  },
  async onDisable() {
    // implement webhook deletion logic
  },
  async run(context) {
    return [context.payload.body];
  },
});
