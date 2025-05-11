import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { pcloudAuth } from '../../index';

export const folderCreatedTrigger = createTrigger({
  auth: pcloudAuth,
  name: 'folder_created',
  displayName: 'Folder Created',
  description: 'Triggers when a new folder is created',
  props: {
    parentFolderId: Property.Number({
      displayName: 'Parent Folder ID',
      description: 'The parent folder ID to monitor for new folders (0 for root)',
      required: true,
      defaultValue: 0,
    }),
    pollingInterval: Property.Number({
      displayName: 'Polling Interval',
      description: 'How often to check for new folders (in minutes)',
      required: true,
      defaultValue: 5,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: "123456789",
    name: "New Project",
    created: "2023-09-01T12:00:00Z",
    modified: "2023-09-01T12:00:00Z",
    isfolder: true,
    parentfolderid: 0,
    icon: "folder"
  },
  async onEnable(context) {
    const { parentFolderId } = context.propsValue;

    // Store the last check time to compare on subsequent polls
    await context.store.put('lastCheckTime', new Date().toISOString());

    // Store the parent folder ID we're monitoring
    await context.store.put('monitoredParentFolderId', parentFolderId.toString());

    // Initialize known folder IDs
    const response = await makeRequest(
      (context.auth as { access_token: string }).access_token,
      HttpMethod.GET,
      '/listfolder',
      null,
      {
        folderid: parentFolderId.toString(),
        recursive: '0', // Only direct subfolders
      }
    );

    const knownFolderIds: string[] = [];

    if (response && response.metadata && response.metadata.contents) {
      // Filter for folders only
      const folders = response.metadata.contents.filter((item: any) => item.isfolder);

      for (const folder of folders) {
        knownFolderIds.push(folder.id.toString());
      }
    }

    await context.store.put('knownFolderIds', knownFolderIds);
  },
  async onDisable(context) {
    // Clean up stored data
    await context.store.delete('lastCheckTime');
    await context.store.delete('monitoredParentFolderId');
    await context.store.delete('knownFolderIds');
  },
  async run(context) {
    const monitoredParentFolderId = await context.store.get<string>('monitoredParentFolderId');
    const knownFolderIds = await context.store.get<string[]>('knownFolderIds') || [];

    // Get current folders
    const response = await makeRequest(
      (context.auth as { access_token: string }).access_token,
      HttpMethod.GET,
      '/listfolder',
      null,
      {
        folderid: monitoredParentFolderId || context.propsValue.parentFolderId.toString(),
        recursive: '0', // Only direct subfolders
      }
    );

    const newFolders = [];
    const currentFolderIds: string[] = [];

    if (response && response.metadata && response.metadata.contents) {
      // Filter for folders only
      const folders = response.metadata.contents.filter((item: any) => item.isfolder);

      for (const folder of folders) {
        currentFolderIds.push(folder.id.toString());

        // Check if this is a new folder
        if (!knownFolderIds.includes(folder.id.toString())) {
          newFolders.push(folder);
        }
      }
    }

    // Update stored data
    await context.store.put('lastCheckTime', new Date().toISOString());
    await context.store.put('knownFolderIds', currentFolderIds);

    return newFolders;
  },
});
