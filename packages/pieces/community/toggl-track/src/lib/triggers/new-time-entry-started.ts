import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';
import { Polling, pollingHelper } from '@activepieces/pieces-common';
import { DedupeStrategy } from '@activepieces/pieces-common';

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const timeEntry = await togglTrackApi.getRunningTimeEntry(auth);
    if (timeEntry) {
      return [
        {
          id: timeEntry.id,
          data: timeEntry,
        },
      ];
    }
    return [];
  },
};

export const newTimeEntryStarted = createTrigger({
  auth: togglTrackAuth,
  name: 'new_time_entry_started',
  displayName: 'New Time Entry Started',
  description: 'Fires when a time entry is started and is currently running.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    "id": 123456789,
    "wid": 123456,
    "pid": 1234567,
    "billable": false,
    "start": "2023-01-01T12:00:00Z",
    "duration": -1,
    "description": "Doing something",
    "tags": [],
    "at": "2023-01-01T13:00:00Z"
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
