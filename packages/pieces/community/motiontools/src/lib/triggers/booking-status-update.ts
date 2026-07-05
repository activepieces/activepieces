import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { motiontoolsAuth } from '../common/auth';
export const bookingStatusUpdate = createTrigger({
  auth: motiontoolsAuth,
  name: 'bookingStatusUpdate',
  displayName: 'Booking Status Update',
  description:
    'Triggers when a booking status is updated.  Only available if you have a MotionToolsadmin account',
  aiMetadata: {
    description: 'Fires when an existing booking is modified in MotionTools (the booking.modified webhook event), e.g. its status changes. Each event carries the affected booking and customer ids. Requires a MotionTools admin account to register the webhook.',
  },
  props: {
    instructions: Property.MarkDown({
      value: `# Motiontools Webhook Setup

1. Open Motiontools → Settings → Advanced → Webhooks
2. Click **Create webhook**
3. Name: e.g., Activepieces Booking Status Update
4. Endpoint URL: paste the Activepieces webhook URL below:

\`\`\`text
            {{webhookUrl}}
            \`\`\`  
5. Enable event: **booking.modified**
6. Toggle **Active** and click **Save**
`,
    }),
  },
  sampleData: {
    id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
    timestamp: '2020-11-09T10:19:07Z',
    resource_type: 'booking',
    event: 'modified',
    data: {
      booking_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      customer_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      external_id: 'string',
      service_area_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
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
      body.event === 'modified' &&
      body.resource_type === 'booking' &&
      body.data
    ) {
      return [body];
    }
    return [];
  },
});
