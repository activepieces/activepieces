import { Property, createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../..';
import { togglTrackApi } from '../common';
import { Polling, pollingHelper } from '@activepieces/pieces-common';
import { DedupeStrategy } from '@activepieces/pieces-common';

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const workspaces = await togglTrackApi.getWorkspaces(auth);
    return workspaces.map((workspace) => {
      return {
        id: workspace.id,
        data: workspace,
      };
    });
  },
};

export const newWorkspace = createTrigger({
  auth: togglTrackAuth,
  name: 'new_workspace',
  displayName: 'New Workspace',
  description: 'Fires when a new workspace is created.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    "id": 123456,
    "name": "New Workspace",
    "at": "2023-01-01T12:00:00Z"
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
