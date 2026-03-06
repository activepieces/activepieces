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

    const files = await getRecentItems(auth, folderId, afterTimestamp, 'files');

    return files.map((file: PCloudItem) => ({
      epochMilliSeconds: new Date(file.created).getTime(),
      data: file,
    }));
  },
};

export const newFileUploaded = createTrigger({
  auth: pCloudAuth,
  name: 'new_file_uploaded',
  displayName: 'New File Uploaded',
  description:
    'Triggers when a new file is uploaded to the specified pCloud folder (or any subfolder if no folder is selected).',
  type: TriggerStrategy.POLLING,
  props: {
    folder_id: pCloudFolderIdProp,
  },
  sampleData: {
    fileid: 123456789,
    name: 'example-document.pdf',
    path: '/Documents/example-document.pdf',
    parentfolderid: 0,
    created: '2024-01-15T10:30:00+00:00',
    modified: '2024-01-15T10:30:00+00:00',
    ismine: true,
    isshared: false,
    isfolder: false,
    size: 204800,
    contenttype: 'application/pdf',
    icon: 'file',
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
