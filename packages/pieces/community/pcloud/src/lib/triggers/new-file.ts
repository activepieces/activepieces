import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../../index';
import { PCloudClient } from '../common';

export const pcloudNewFile = createTrigger({
  auth: pcloudAuth,
  name: 'new_file',
  displayName: 'New File Uploaded',
  description: 'Triggers when a new file is uploaded to pCloud',
  type: TriggerStrategy.POLLING,
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'ID of folder to monitor (0 for root)',
      required: false,
      defaultValue: 0,
    }),
  },
  sampleData: {
    fileid: 123456,
    name: 'example.txt',
    size: 1024,
    contenttype: 'text/plain',
    created: '2025-01-01T00:00:00Z',
    modified: '2025-01-01T00:00:00Z',
    isfolder: false,
    parentfolderid: 0,
  },
  async onEnable(context) {
    await context.store.put('lastPollTime', Date.now());
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const folderId = context.propsValue.folderId ?? 0;
    const storedTime = await context.store.get<number>('lastPollTime');
    const lastPollTime = typeof storedTime === 'number' ? storedTime : 0;

    const result = await client.listFolder(folderId);
    
    if (result.result !== 0) {
      return [];
    }

    const metadata = result.metadata as any;
    const contents = metadata?.contents || [];
    
    const newFiles = contents.filter((item: any) => {
      if (item.isfolder) return false;
      const createdTime = new Date(item.created).getTime();
      return createdTime > lastPollTime;
    });

    await context.store.put('lastPollTime', Date.now());
    
    return newFiles;
  },
  async test(context) {
    const client = new PCloudClient(context.auth);
    const folderId = context.propsValue.folderId ?? 0;

    const result = await client.listFolder(folderId);
    
    if (result.result !== 0) {
      return [];
    }

    const metadata = result.metadata as any;
    const contents = metadata?.contents || [];
    const files = contents.filter((item: any) => !item.isfolder);
    
    return files.slice(0, 5);
  },
});
