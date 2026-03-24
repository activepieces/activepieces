import {
  Property,
  createTrigger,
  TriggerStrategy,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { PCloudClient, PCloudItem } from '../common/client';

const polling: Polling<OAuth2PropertyValue, { folder_id: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const client = new PCloudClient(auth);
    const folderId = parseInt(propsValue.folder_id, 10);
    const folder = await client.listFolder(folderId);
    const folders = folder.contents.filter(
      (f): f is PCloudItem & { folderid: number } =>
        f.isfolder && f.folderid !== undefined,
    );

    return folders.map((f) => ({
      epochMilliSeconds: new Date(f.created).getTime(),
      data: {
        folderid: f.folderid,
        name: f.name,
        created: new Date(f.created).toISOString(),
        modified: new Date(f.modified).toISOString(),
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
