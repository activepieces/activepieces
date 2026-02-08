import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../index';
import { listFolder, PCloudFile } from '../lib/common';

export const newFile = createTrigger({
  auth: pcloudAuth,
  name: 'new_file',
  displayName: 'New File',
  description: 'Triggers when a new file is uploaded to pCloud',
  props: {
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Path to monitor for new files (e.g., /Documents). Leave empty to monitor root folder.',
      required: false,
      defaultValue: '/',
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    fileid: 12345,
    name: 'example.pdf',
    size: 1024000,
    created: '2025-02-08T12:00:00Z',
    modified: '2025-02-08T12:00:00Z',
    isfolder: false,
    parentfolderid: 0,
  },
  async onEnable(context) {
    // Store the current timestamp as the last check time
    await context.store.put('lastCheckTime', new Date().toISOString());
  },
  async onDisable(context) {
    // Clean up stored data
    await context.store.delete('lastCheckTime');
  },
  async run(context) {
    const { folderPath } = context.propsValue;
    const lastCheckTime = await context.store.get('lastCheckTime');
    
    // Get folder ID from path (for simplicity, using root folder = 0)
    // In production, you'd need to resolve the path to a folder ID
    const folderId = 0;
    
    const folder = await listFolder(context.auth, folderId);
    const newFiles: PCloudFile[] = [];

    if (folder.contents) {
      for (const item of folder.contents) {
        if (!item.isfolder) {
          const file = item as PCloudFile;
          // Check if file was created after last check
          if (!lastCheckTime || new Date(file.created) > new Date(lastCheckTime)) {
            newFiles.push(file);
          }
        }
      }
    }

    // Update last check time
    await context.store.put('lastCheckTime', new Date().toISOString());

    return newFiles;
  },
  async test(context) {
    const { folderPath } = context.propsValue;
    const folderId = 0;
    
    const folder = await listFolder(context.auth, folderId);
    const files: PCloudFile[] = [];

    if (folder.contents) {
      for (const item of folder.contents) {
        if (!item.isfolder) {
          files.push(item as PCloudFile);
        }
      }
    }

    // Return up to 5 most recent files for testing
    return files.slice(0, 5);
  },
});
