import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { hystructAuth } from '../../index';

export const workflowEvent = createTrigger({
  auth: hystructAuth,
  name: 'workflow_event',
  displayName: 'Workflow Event',
  description: 'Triggers when a workflow event occurs (e.g., job completed, data updated)',
  type: TriggerStrategy.WEBHOOK,
  props: {
    markdown: Property.MarkDown({
      value: `## Webhook Setup

To receive workflow events, set up a webhook in your Hystruct dashboard:

1. Log in to Hystruct and go to **Integrations**
2. Click **Webhooks** → **Create webhook**
3. Paste this URL as the Webhook URL:
\`\`\`text
{{webhookUrl}}
\`\`\`
4. Select the events you want to subscribe to
5. Optionally enter a Workflow ID to filter events
6. Click **Save**
`,
    }),
  },
  async onEnable() {
    // User configures webhook manually in Hystruct dashboard
  },
  async onDisable() {
    // User removes webhook manually in Hystruct dashboard
  },
  async run(context) {
    return [context.payload.body];
  },
  async test() {
    return [
      {
        workflowId: 'wf_abc123',
        event: 'job.completed',
        data: {
          jobId: 'job_xyz789',
          status: 'completed',
          completedAt: new Date().toISOString(),
        },
      },
    ];
  },
  sampleData: {
    workflowId: 'wf_abc123',
    event: 'job.completed',
    data: {
      jobId: 'job_xyz789',
      status: 'completed',
      completedAt: '2024-01-15T10:30:00Z',
    },
  },
});
