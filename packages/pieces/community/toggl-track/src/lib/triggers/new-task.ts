import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';
import {
  generateTogglWebhookInstructions,
  TOGGL_WEBHOOK_EVENTS,
} from '../common/webhook-instructions';

export const newTask = createTrigger({
  auth: togglTrackAuth,
  name: 'new_task',
  displayName: 'New Task',
  description: 'Fires when a new task is created.',
  props: {
    workspace_id: togglCommon.workspace_id,
    optional_project_id: togglCommon.optional_project_id,
    setupInstructions: Property.MarkDown({
      value: generateTogglWebhookInstructions(
        TOGGL_WEBHOOK_EVENTS.TASK_CREATED,
        'New Task',
        'Create a test task to ensure events are received',
        `This trigger will fire when tasks are created and will include:
- Task ID and details
- Project association
- Workspace information
- Creation timestamp
- Creator information
- Task settings (estimated time, active status, etc.)

**Note:** You can filter tasks by project using the optional project filter above.`
      ),
    }),
  },
  sampleData: {
    id: 789123456,
    name: 'Design homepage mockup',
    project_id: 123456789,
    workspace_id: 987654,
    user_id: 6,
    estimated_seconds: 7200,
    active: true,
    at: '2025-08-29T10:15:30+00:00',
    tracked_seconds: 0,
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
    
    if (payload?.payload === 'ping') {
      return [];
    }

    if (context.propsValue.optional_project_id && payload?.project_id) {
      if (payload.project_id !== context.propsValue.optional_project_id) {
        return [];
      }
    }

    return [payload];
  },
});
