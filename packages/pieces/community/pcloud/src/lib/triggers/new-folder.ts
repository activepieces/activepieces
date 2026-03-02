import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../../index';
import { PCloudClient } from '../common';

export const pcloudNewFolder = createTrigger({
  auth: pcloudAuth,
  name: 'new_folder',
  displayName: 'Folder Created',
  description: 'Triggers when a new folder is created in pCloud',
  type: TriggerStrategy.POLLING,
  props: {
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'ID of parent folder to monitor (0 for root)',
      required: false,
      defaultValue: 0,
    }),
  },
  sampleData: {
    folderid: 123456,
    name: 'New Folder',
    created: '2025-01-01T00:00:00Z',
    modified: '2025-01-01T00:00:00Z',
  },
  async onEnable(context) {
    await context.store.put('lastPollTime', Date.now());
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const parentFolderId = context.propsValue.parentFolderId ?? 0;
    const storedTime = await context.store.get<number>('lastPollTime');
    const lastPollTime = typeof storedTime === 'number' ? storedTime : 0;

    const result = await client.listFolder(parentFolderId);
    
    if (result.result !== 0) {
      return [];
    }

    const metadata = result.metadata as any;
    const contents = metadata?.contents || [];
    
    const newFolders = contents.filter((item: any) => {
      if (!item.isfolder) return false;
      const createdTime = new Date(item.created).getTime();
      return createdTime > lastPollTime;
    });

    await context.store.put('lastPollTime', Date.now());
    
    return newFolders;
  },
  async test(context) {
    const client = new PCloudClient(context.auth);
    const parentFolderId = context.propsValue.parentFolderId ?? 0;

    const result = await client.listFolder(parentFolderId);
    
    if (result.result !== 0) {
      return [];
    }

    const metadata = result.metadata as any;
    const contents = metadata?.contents || [];
    const folders = contents.filter((item: any) => item.isfolder);
    
    return folders.slice(0, 5);
  },
});
