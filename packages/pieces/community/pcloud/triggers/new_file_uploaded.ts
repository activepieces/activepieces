import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { PCloudClient } from '../common/client';

const polling = {
  strategy: TriggerStrategy.POLLING,
  sampleInterval: 60,
};

export const newFileUploaded = createTrigger({
  auth: pcloudAuth,
  name: 'new_file_uploaded',
  displayName: 'New File Uploaded',
  description: 'Triggers when a new file is uploaded to a monitored folder',
  props: {
    folder_id: {
      displayName: 'Folder',
      description: 'The folder to monitor for new files',
      type: 'string',
      required: true,
    },
  },
  polling,
  async onEnable(context) {
    // Initialize state
    await context.store?.put('last_check_time', Date.now().toString());
  },
  async onDisable(context) {
    // Clean up state
    await context.store?.delete('last_check_time');
  },
  async test(context) {
    const client = new PCloudClient(context.auth);
    const folderid = parseInt(context.propsValue.folder_id);

    try {
      const folder = await client.listFolder(folderid);
      const files = folder.contents.filter((f) => !f.isdir);

      if (files.length > 0) {
        return [
          {
            id: files[0].id,
            name: files[0].name,
            size: files[0].size,
            created: new Date(files[0].created * 1000).toISOString(),
            modified: new Date(files[0].modified * 1000).toISOString(),
          },
        ];
      }

      return [];
    } catch (error) {
      console.error('Error fetching folder:', error);
      return [];
    }
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const folderid = parseInt(context.propsValue.folder_id);

    try {
      const lastCheckStr = await context.store?.get('last_check_time');
      const lastCheckTime = lastCheckStr ? parseInt(lastCheckStr) : Date.now() - 60000;

      const folder = await client.listFolder(folderid);
      const newFiles = folder.contents.filter(
        (f) =>
          !f.isdir &&
          f.modified * 1000 > lastCheckTime,
      );

      await context.store?.put('last_check_time', Date.now().toString());

      return newFiles.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        created: new Date(file.created * 1000).toISOString(),
        modified: new Date(file.modified * 1000).toISOString(),
      }));
    } catch (error) {
      console.error('Error in new file uploaded trigger:', error);
      return [];
    }
  },
});
