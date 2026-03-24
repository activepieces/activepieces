import {
  Property,
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { PCloudClient } from '../common/client';

const polling: Polling<any, { folder_id: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const client = new PCloudClient(auth);
    const folderId = parseInt(propsValue.folder_id, 10);
    const folder = await client.listFolder(folderId);
    const folders = folder.contents.filter((f) => f.isfolder);

    return folders.map((f) => ({
      epochMilliSeconds: f.created * 1000,
      data: {
        folderid: f.fileid,
        name: f.name,
        created: new Date(f.created * 1000).toISOString(),
        modified: new Date(f.modified * 1000).toISOString(),
        parentfolderid: f.parentfolderid,
      },
    }));
  },
};

export const newFolderCreated = createTrigger({
  auth: pcloudAuth,
  name: 'pcloud_new_folder_created',
  displayName: 'New Folder Created',
  description:
    'Triggers when a new folder is created inside a monitored folder.',
  type: TriggerStrategy.POLLING,
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'The pCloud folder ID to monitor. Use 0 for the root folder.',
      required: true,
      defaultValue: '0',
    }),
  },
  sampleData: {
    folderid: 789012,
    name: 'New Project',
    created: '2024-01-15T10:30:00.000Z',
    modified: '2024-01-15T10:30:00.000Z',
    parentfolderid: 0,
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
