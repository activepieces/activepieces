import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';
import {
  generateTogglWebhookInstructions,
  TOGGL_WEBHOOK_EVENTS,
} from '../common/webhook-instructions';

export const newProject = createTrigger({
  auth: togglTrackAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Fires when a new project is added.',
  props: {
    workspace_id: togglCommon.workspace_id,
    setupInstructions: Property.MarkDown({
      value: generateTogglWebhookInstructions(
        TOGGL_WEBHOOK_EVENTS.PROJECT_CREATED,
        'New Project',
        'Create a test project to ensure events are received',
        `This trigger will fire when projects are created and will include:
- Project ID and details
- Workspace information
- Client association (if any)
- Creation timestamp
- Creator information
- Project settings (color, billable status, etc.)`
      ),
    }),
  },
  sampleData: {
    id: 123456789,
    workspace_id: 987654,
    client_id: 456789,
    name: 'New Website Development',
    is_private: false,
    active: true,
    at: '2025-08-29T10:15:30+00:00',
    color: '#3750b5',
    billable: true,
    template: false,
    auto_estimates: false,
    estimated_hours: 40,
    rate: 75.0,
    rate_last_updated: null,
    currency: 'USD',
    recurring: false,
    recurring_parameters: null,
    current_period: null,
    fixed_fee: null,
    actual_hours: 0,
    actual_seconds: 0,
  },
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
    paramName: 'validation_code',
  },

  async onHandshake(context) {
    const body = context.payload.body as any;
    
    if (body?.payload === 'ping' && body?.validation_code) {
      return {
        status: 200,
        body: { validation_code: body.validation_code },
        headers: { 'Content-Type': 'application/json' },
      };
    }
    
    return { status: 400, body: { error: 'Invalid handshake request' } };
  },

  async onEnable(context) {
    // Manual setup - no programmatic registration needed
  },

  async onDisable(context) {
    // Manual setup - users manage webhooks in Toggl Track UI
  },

  async run(context) {
    const payload = context.payload.body as any;
    
    // Handle validation pings automatically
    if (payload?.payload === 'ping' && payload?.validation_code && payload?.validation_code_url) {
      try {
        // Automatically validate the webhook using Toggl's validation URL
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: payload.validation_code_url,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Webhook automatically validated:', response.status);
      } catch (error) {
        console.error('Failed to auto-validate webhook:', error);
      }
      
      return [];
    }
    
    return [payload];
  },
});
