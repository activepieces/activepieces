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
    const files = folder.contents.filter(
      (f): f is PCloudItem & { fileid: number } =>
        !f.isfolder && f.fileid !== undefined,
    );

    return files.map((file) => ({
      epochMilliSeconds: new Date(file.created).getTime(),
      data: {
        fileid: file.fileid,
        name: file.name,
        size: file.size,
        created: new Date(file.created).toISOString(),
        modified: new Date(file.modified).toISOString(),
        parentfolderid: file.parentfolderid,
        contenttype: file.contenttype,
      },
    }));
  },
};

export const newFileUploaded = createTrigger({
  auth: pcloudAuth,
  name: 'pcloud_new_file_uploaded',
  displayName: 'New File Uploaded',
  description:
    'Triggers when a new file is uploaded to a monitored folder.',
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
    fileid: 123456,
    name: 'example.pdf',
    size: 1024,
    created: '2024-01-15T10:30:00.000Z',
    modified: '2024-01-15T10:30:00.000Z',
    parentfolderid: 0,
    contenttype: 'application/pdf',
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
