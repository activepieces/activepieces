import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { clockifyAuth } from '../../index';

export const newTimeEntryTrigger = createTrigger({
  auth: clockifyAuth,
  name: 'new_time_entry',
  displayName: 'New Time Entry',
  description: 'Triggers when a new time entry is created in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The ID of the workspace',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user (leave empty to monitor all users if you have admin rights)',
      required: false,
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async ({ store }) => {
    await store.put('lastFetchedTimeEntry', new Date().toISOString());
  },
  onDisable: async () => {
    // Nothing to clean up
  },
  run: async ({ store, auth, propsValue }) => {
    const lastFetchedTimeEntry = await store.get('lastFetchedTimeEntry') as string;
    const currentTime = new Date().toISOString();

    let endpoint = `/workspaces/${propsValue.workspaceId}`;

    // If user ID is provided, get time entries for that user only
    if (propsValue.userId) {
      endpoint += `/user/${propsValue.userId}`;
    }

    endpoint += `/time-entries`;

    const timeEntries = await makeRequest(
      auth as string,
      HttpMethod.GET,
      endpoint
    );

    // Filter time entries that were created after the last check
    const newTimeEntries = timeEntries.filter((entry: any) => {
      const entryCreationTime = new Date(entry.timeInterval.start).toISOString();
      return entryCreationTime > lastFetchedTimeEntry;
    });

    await store.put('lastFetchedTimeEntry', currentTime);

    return newTimeEntries.map((entry: any) => {
      return {
        id: entry.id,
        payload: entry,
      };
    });
  },
});
