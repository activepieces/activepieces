import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { pcloudAuth } from '../../index';

export const newFileUploadedTrigger = createTrigger({
  auth: pcloudAuth,
  name: 'new_file_uploaded',
  displayName: 'New File Uploaded',
  description: 'Triggers when a new file is uploaded to a folder',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The folder ID to monitor for new files (0 for root)',
      required: true,
      defaultValue: 0,
    }),
    pollingInterval: Property.Number({
      displayName: 'Polling Interval',
      description: 'How often to check for new files (in minutes)',
      required: true,
      defaultValue: 5,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: "123456789",
    name: "sample.pdf",
    created: "2023-09-01T12:00:00Z",
    modified: "2023-09-01T12:00:00Z",
    size: 123456,
    isfolder: false,
    parentfolderid: 0,
    hash: "abcdef1234567890",
    contenttype: "application/pdf",
    icon: "pdf"
  },
  async onEnable(context) {
    const { folderId } = context.propsValue;

    // Store the last check time to compare on subsequent polls
    await context.store.put('lastCheckTime', new Date().toISOString());

    // Store the folder ID we're monitoring
    await context.store.put('monitoredFolderId', folderId.toString());
  },
  async onDisable(context) {
    // Clean up stored data
    await context.store.delete('lastCheckTime');
    await context.store.delete('monitoredFolderId');
    await context.store.delete('knownFileIds');
  },
  async run(context) {
    const lastCheckTime = await context.store.get<string>('lastCheckTime');
    const monitoredFolderId = await context.store.get<string>('monitoredFolderId');
    const knownFileIds = await context.store.get<string[]>('knownFileIds') || [];

    // Get current files in the folder
    const response = await makeRequest(
      (context.auth as { access_token: string }).access_token,
      HttpMethod.GET,
      '/listfolder',
      null,
      {
        folderid: monitoredFolderId || context.propsValue.folderId.toString(),
        recursive: '0', // Only direct files in this folder
      }
    );

    const newFiles = [];
    const currentFileIds: string[] = [];

    if (response && response.metadata && response.metadata.contents) {
      // Filter for files only (not folders)
      const files = response.metadata.contents.filter((item: any) => !item.isfolder);

      for (const file of files) {
        currentFileIds.push(file.id.toString());

        // Check if this is a new file
        if (!knownFileIds.includes(file.id.toString())) {
          newFiles.push(file);
        }
      }
    }

    // Update stored data
    await context.store.put('lastCheckTime', new Date().toISOString());
    await context.store.put('knownFileIds', currentFileIds);

    return newFiles;
  },
});
