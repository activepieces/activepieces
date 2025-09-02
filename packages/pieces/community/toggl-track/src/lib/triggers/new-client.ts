import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';
import {
  generateTogglWebhookInstructions,
  TOGGL_WEBHOOK_EVENTS,
} from '../common/webhook-instructions';

export const newClient = createTrigger({
  auth: togglTrackAuth,
  name: 'new_client',
  displayName: 'New Client',
  description: 'Fires when a new client is created in a workspace.',
  props: {
    workspace_id: togglCommon.workspace_id,
    setupInstructions: Property.MarkDown({
      value: generateTogglWebhookInstructions(
        TOGGL_WEBHOOK_EVENTS.CLIENT_CREATED,
        'New Client',
        'Create a test client to ensure events are received',
        `This trigger will fire when clients are created and will include:
- Client ID and details
- Workspace information
- Creation timestamp
- Creator information
- Client notes and status`
      ),
    }),
  },
  sampleData: {
    id: 123456,
    name: 'Acme Corporation',
    wid: 987654,
    archived: false,
    at: '2025-08-29T10:15:30+00:00',
    creator_id: 6,
    notes: 'Important client for Q4 projects',
  },
  type: TriggerStrategy.WEBHOOK,


  async onEnable(context) {
    // Manual setup - no programmatic registration needed
  },

  async onDisable(context) {
    // Manual setup - users manage webhooks in Toggl Track UI
  },

  async run(context) {
    const payload = context.payload.body as any;

    // Handle validation pings automatically
    if (
      payload?.payload === 'ping' ||
      payload?.validation_code ||
      payload?.validation_code_url
    ) {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: payload.validation_code_url,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        return [
          {
            message: 'Webhook validation successful',
            timestamp: new Date().toISOString(),
            status: 'validated',
          },
        ];
      } catch (error) {
        console.error('Failed to auto-validate webhook:', error);
      }

      return [];
    }

    return [payload];
  },
});
