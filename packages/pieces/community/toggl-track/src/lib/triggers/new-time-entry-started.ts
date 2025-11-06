import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';
import {
  HttpMethod,
  httpClient,
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

const polling: Polling<string, any> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const authHeader = `Basic ${Buffer.from(`${auth}:api_token`).toString('base64')}`;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.track.toggl.com/api/v9/me/time_entries',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const timeEntries = response.body as any[];
    
    const runningEntries = timeEntries.filter((entry: any) => {
      const isRunning = entry.duration < 0;
      const isInWorkspace = !propsValue.workspace_id || 
                           entry.workspace_id === propsValue.workspace_id;
      return isRunning && isInWorkspace;
    });

    return runningEntries.map((entry: any) => ({
      epochMilliSeconds: new Date(entry.start).getTime(),
      data: entry,
    }));
  },
};

export const newTimeEntryStarted = createTrigger({
  auth: togglTrackAuth,
  name: 'new_time_entry_started',
  displayName: 'New Time Entry Started',
  description: 'Fires when a new time entry is started and is currently running.',
  props: {
    workspace_id: togglCommon.workspace_id,
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
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },

  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
