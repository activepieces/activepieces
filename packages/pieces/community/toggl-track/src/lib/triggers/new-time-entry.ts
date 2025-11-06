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

  async onEnable(context) {
    // Manual setup - no programmatic registration needed
  },

  async onDisable(context) {
    // Manual setup - users manage webhooks in Toggl Track UI
  },

  async run(context) {
    const payload = context.payload.body as any;
    
    if (payload?.payload === 'ping' || payload?.validation_code || payload?.validation_code_url) {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: payload.validation_code_url,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      } catch (error) {
        console.error('Failed to auto-validate webhook:', error);
      }
      
      return [
        {
          message: 'Webhook validation successful',
          timestamp: new Date().toISOString(),
          status: 'validated',
        },
      ];
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
