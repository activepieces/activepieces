import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { motiontoolsAuth } from '../common/auth';

export const bookingCreated = createTrigger({
  auth: motiontoolsAuth,
  name: 'bookingCreated',
  displayName: 'Booking Created',
  description: 'Triggers when a new booking is created.  Only available if you have a MotionToolsadmin account',
  props: {
    instructions: Property.MarkDown({
      value: `# Motiontools Webhook Setup

1. Open Motiontools → Settings → Advanced → Webhooks
2. Click **Create webhook**
3. Name: e.g., Activepieces Booking Created
4. Endpoint URL: paste the Activepieces webhook URL below:

\`\`\`text
			{{webhookUrl}}
			\`\`\`

5. Enable event: **booking.created**
6. Toggle **Active** and click **Save**
`,
    }),
  },
  sampleData: {
    id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
    timestamp: '2020-11-09T10:19:07Z',
    resource_type: 'booking',
    event: 'created',
    data: {
      booking_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      service_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      customer_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      service_area_id: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      place_ids: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      scheduled_at: '2020-11-09T10:19:07Z',
      status: 'cancelled',
      requested_capabilities: {
        property1: 'string',
        property2: 'string',
      },
      managing_organization_ids: 'db76ba31-96f8-4c95-b71d-85ade5c7a640',
      external_id: 'string',
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
      body.resource_type === 'booking' &&
      body.data
    ) {
      return body;
    }

    return [];
  },
});
