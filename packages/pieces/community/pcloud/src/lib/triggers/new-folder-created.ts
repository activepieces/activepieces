import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  DedupeStrategy,
  Polling,
} from '@activepieces/pieces-framework';
import { pollingHelper } from '@activepieces/pieces-common';
import { pCloudAuth } from '../auth';
import { pCloudFolderIdProp, getRecentItems, PCloudItem } from '../common';

const polling: Polling<PiecePropValueSchema<typeof pCloudAuth>, {
  folder_id?: string;
}> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const folderId = propsValue.folder_id ?? '0';
    const afterTimestamp =
      lastFetchEpochMS > 0 ? new Date(lastFetchEpochMS).toISOString() : undefined;

    const folders = await getRecentItems(auth, folderId, afterTimestamp, 'folders');

    return folders.map((folder: PCloudItem) => ({
      epochMilliSeconds: new Date(folder.created).getTime(),
      data: folder,
    }));
  },
};

export const newFolderCreated = createTrigger({
  auth: pCloudAuth,
  name: 'new_folder_created',
  displayName: 'New Folder Created',
  description:
    'Triggers when a new folder is created inside the specified pCloud folder (or anywhere in your pCloud if no folder is selected).',
  type: TriggerStrategy.POLLING,
  props: {
    folder_id: pCloudFolderIdProp,
  },
  sampleData: {
    folderid: 987654321,
    name: 'New Project Folder',
    path: '/Projects/New Project Folder',
    parentfolderid: 0,
    created: '2024-01-15T11:00:00+00:00',
    modified: '2024-01-15T11:00:00+00:00',
    ismine: true,
    isshared: false,
    isfolder: true,
    icon: 'folder',
  },
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
