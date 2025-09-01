import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import {
  generateTogglWebhookInstructions,
  TOGGL_WEBHOOK_EVENTS,
} from '../common/webhook-instructions';

export const newWorkspace = createTrigger({
  auth: togglTrackAuth,
  name: 'new_workspace',
  displayName: 'New Workspace',
  description: 'Fires when a new workspace is created.',
  props: {
    setupInstructions: Property.MarkDown({
      value: generateTogglWebhookInstructions(
        TOGGL_WEBHOOK_EVENTS.WORKSPACE_CREATED,
        'New Workspace',
        'Create a test workspace to ensure events are received',
        `This trigger will fire when workspaces are created and will include:
- Workspace ID and details
- Organization information
- Creation timestamp
- Creator information
- Workspace settings (currency, permissions, etc.)`
      ),
    }),
  },
  sampleData: {
    id: 123456,
    organization_id: 98765,
    name: 'My New Workspace',
    premium: true,
    admin: true,
    default_currency: 'USD',
    only_admins_may_create_projects: false,
    only_admins_see_billable_rates: true,
    rounding: 1,
    rounding_minutes: 0,
    at: '2025-08-29T10:15:30+00:00',
    logo_url: 'https://assets.toggl.com/images/workspace.jpg',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    // Manual setup - no programmatic registration needed
  },

  async onDisable(context) {
    // Manual setup - users manage webhooks in Toggl Track UI
  },

  async run(context) {
    return [context.payload.body];
  },
});
