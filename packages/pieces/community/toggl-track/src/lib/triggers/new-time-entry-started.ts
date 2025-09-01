import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';
import {
  generateTogglWebhookInstructions,
  TOGGL_WEBHOOK_EVENTS,
} from '../common/webhook-instructions';

export const newTimeEntryStarted = createTrigger({
  auth: togglTrackAuth,
  name: 'new_time_entry_started',
  displayName: 'New Time Entry Started',
  description: 'Fires when a time entry is started and is currently running.',
  props: {
    workspace_id: togglCommon.workspace_id,
    setupInstructions: Property.MarkDown({
      value: generateTogglWebhookInstructions(
        TOGGL_WEBHOOK_EVENTS.TIME_ENTRY_CREATED,
        'New Time Entry Started',
        'Start a test time entry to ensure events are received',
        `This trigger will fire when time entries are started and will include:
- Time entry ID and details
- Start time (stop time will be null for running entries)
- Negative duration indicating it's currently running
- Project and task associations (if any)
- Workspace information
- Description and tags
- Creator information
- Billable status

**Note:** This trigger specifically filters for started/running time entries (those with negative duration). You may also want to listen for "Time entry updated" events to catch when existing entries are restarted.`
      ),
    }),
  },
  sampleData: {
    id: 1234567891,
    workspace_id: 987654,
    project_id: 123987456,
    task_id: null,
    billable: false,
    start: '2025-08-29T11:15:00Z',
    stop: null,
    duration: -1734567890,
    description: 'Working on API integration',
    tags: ['development', 'api'],
    at: '2025-08-29T11:15:00+00:00',
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
    const payload = context.payload.body;
    
    // Check if this is a started time entry (negative duration indicates running)
    if (payload && typeof payload === 'object') {
      const timeEntryData = payload as any;

      // A time entry is considered "started" if it has negative duration
      if (timeEntryData.duration && timeEntryData.duration < 0) {
        return [timeEntryData];
      }
    }

    return [];
  },
});
