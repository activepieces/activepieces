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

export const newTimeEntry = createTrigger({
  auth: togglTrackAuth,
  name: 'new_time_entry',
  displayName: 'New Time Entry',
  description:
    'Fires when a new time entry is added (with optional project/task filter).',
  props: {
    workspace_id: togglCommon.workspace_id,
    optional_project_id: togglCommon.optional_project_id,
    task_id: togglCommon.optional_task_id,
    setupInstructions: Property.MarkDown({
      value: generateTogglWebhookInstructions(
        TOGGL_WEBHOOK_EVENTS.TIME_ENTRY_CREATED,
        'New Time Entry',
        'Create a test time entry to ensure events are received',
        `This trigger will fire when time entries are created and will include:
- Time entry ID and details
- Start/stop times and duration
- Project and task associations (if any)
- Workspace information
- Description and tags
- Creator information
- Billable status

**Note:** You can filter time entries by project and task using the optional filters above.`
      ),
    }),
  },
  sampleData: {
    id: 1234567890,
    workspace_id: 987654,
    project_id: 123987456,
    task_id: 789123456,
    billable: false,
    start: '2025-08-29T11:00:00Z',
    stop: '2025-08-29T11:30:00Z',
    duration: 1800,
    description: 'Weekly team meeting',
    tags: ['meeting', 'internal'],
    at: '2025-08-29T11:30:00+00:00',
    user_id: 6,
    created_with: 'Toggl Track',
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

    if (context.propsValue.optional_project_id && payload?.project_id) {
      if (payload.project_id !== context.propsValue.optional_project_id) {
        return [];
      }
    }

    if (context.propsValue.task_id && payload?.task_id) {
      if (payload.task_id !== context.propsValue.task_id) {
        return [];
      }
    }

    return [payload];
  },
});
