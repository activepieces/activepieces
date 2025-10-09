import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { smarterProctoringAuth } from '../..';

const liveMarkdown = `**Live URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
This webhook will be triggered whenever a proctoring session status changes.
`;

const testMarkdown = `
**Test URL:**

If you want to generate sample data without triggering the flow, append \`/test\` to your webhook URL.
`;

const syncMarkdown = `**Synchronous Requests:**

If you expect a response from this webhook, add \`/sync\` to the end of the URL. 
If it takes more than 30 seconds, it will return a 408 Request Timeout response.

To return data, add a Webhook step to your flow with the Return Response action.
`;

// Authentication for incoming webhooks is validated using the connection API Key

export const sessionStatusChangeTrigger = createTrigger({
  name: 'session_status_change',
  displayName: 'Session Status Change',
  description: 'Triggers when a proctoring session status changes',
  auth: smarterProctoringAuth,
  props: {
    liveMarkdown: Property.MarkDown({
      value: liveMarkdown,
      variant: MarkdownVariant.BORDERLESS,
    }),
    syncMarkdown: Property.MarkDown({
      value: syncMarkdown,
      variant: MarkdownVariant.INFO,
    }),
    testMarkdown: Property.MarkDown({
      value: testMarkdown,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    session_id: "12345",
    status: "COMPLETED",
    student_name: "John Doe",
    student_email: "john.doe@example.com",
    course_name: "Introduction to Computer Science",
    exam_name: "Midterm Exam",
    timestamp: "2023-10-30T15:30:45Z"
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // This will be handled by the ActivePieces platform
  },
  async onDisable() {
    // This will be handled by the ActivePieces platform
  },
  async run(context) {
    const { apiKey } = context.auth as { apiKey?: string };
    const headers = (context.payload.headers ?? {}) as Record<string, string>;

    // normalize header names to lower-case for reliable lookup
    const headersLc = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v as string])
    ) as Record<string, string>;
    const incomingToken = headersLc['token'];

    if (!apiKey || !incomingToken || incomingToken !== apiKey) {
      return [];
    }

    return [context.payload];
  },
});

