import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { motiontoolsAuth } from '../common/auth';
export const packageCreated = createTrigger({
  auth: motiontoolsAuth,
  name: 'packageCreated',
  displayName: 'Package Created',
  description: 'Triggers when a package is created',
  props: {
    instructions: Property.MarkDown({
      value: `# Motiontools Webhook Setup
        
        1. Open Motiontools → Settings → Advanced → Webhooks
        2. Click **Create webhook**
        3. Name: e.g., Activepieces Booking Stop Status Update
        4. Endpoint URL: paste the Activepieces webhook URL below:
        
        \`\`\`text
                    {{webhookUrl}}
                    \`\`\`  
        5. Enable event: **hailing_package.created**
        6. Toggle **Active** and click **Save**
        `,
    }),
  },
  sampleData: {
    id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
    timestamp: '2020-11-09T10:19:07Z',
    resource_type: 'hailing_package',
    event: 'created',
    data: {
      package_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      customer_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      status: 'at_customs',
      customs_status: 'documents_needed',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const body = context.payload.body as any;

    if (
      body.event === 'created' &&
      body.resource_type === 'hailing_package' &&
      body.data
    ) {
      return [body];
    }
    return [];
  },
});
