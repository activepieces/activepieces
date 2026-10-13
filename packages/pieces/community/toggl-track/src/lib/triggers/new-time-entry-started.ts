import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  isNil,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglTimeEntries } from '../common/time-entries';
import { togglOutputSchemas } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof togglTrackAuth>,
  { workspace_id: unknown }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const workspaceId = togglApi.optionalId({
      value: propsValue.workspace_id,
      label: 'Workspace',
    });

    if (togglApi.isTwo(auth)) {
      const targetWorkspaceId =
        workspaceId ?? (await togglApi.twoSettings(auth)).current_workspace_id;
      const running = await togglTimeEntries.twoCurrent({
        auth,
        workspaceId: targetWorkspaceId,
      });
      if (!running || isNil(running.start)) {
        return [];
      }
      return [
        {
          epochMilliSeconds: new Date(running.start).getTime(),
          data: running,
        },
      ];
    }

    const timeEntries = await togglApi.request<RunningEntry[] | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: '/me/time_entries',
    });
    return (timeEntries ?? [])
      .filter(
        (entry) =>
          entry.duration < 0 &&
          (isNil(workspaceId) || entry.workspace_id === workspaceId)
      )
      .map((entry) => ({
        epochMilliSeconds: new Date(entry.start).getTime(),
        data: entry,
      }));
  },
};

export const newTimeEntryStarted = createTrigger({
  auth: togglTrackAuth,
  name: 'new_time_entry_started',
  classification: 'READ',
  displayName: 'New Time Entry Started',
  description:
    'Fires when a new time entry is started and is currently running.',
  aiMetadata: {
    description:
      'Fires when a running timer starts for the connected user, delivering the running entry. Polls Toggl; on Toggl 2.0 a timer started and stopped between two polls is missed.',
  },
  props: {
    workspace_id: togglCommon.workspace_id,
  },
  outputSchema: togglOutputSchemas.timeEntry,
  sampleData: {
    id: 1234567891,
    workspace_id: 987654,
    project_id: 123987456,
    task_id: null,
    billable: false,
    start: '2025-08-29T11:15:00Z',
    stop: null,
    duration: -1756466100,
    description: 'Working on API integration',
    tags: ['development', 'api'],
    tag_ids: [111, 222],
    at: '2025-08-29T11:15:00+00:00',
    user_id: 6,
  },
  type: TriggerStrategy.POLLING,

  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },

  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});

type RunningEntry = {
  id: number;
  workspace_id: number;
  duration: number;
  start: string;
};
