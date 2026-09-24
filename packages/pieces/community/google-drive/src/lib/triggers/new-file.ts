import {
  AppConnectionValueForAuthProperty,
  Property,
  createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';

import dayjs from 'dayjs';
import { googleDriveAuth } from '../auth';
import { common } from '../common';
import { downloadFileFromDrive } from '../common/get-file-content';
import { newFileTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof googleDriveAuth>,
  { parentFolder?: any; include_team_drives?: boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const currentValues =
      (await common.getFiles(auth, {
        parent: propsValue.parentFolder,
        createdTime: lastFetchEpochMS,
        includeTeamDrive: propsValue.include_team_drives,
      })) ?? [];
    const items = currentValues.map((item: any) => ({
      epochMilliSeconds: dayjs(item.createdTime).valueOf(),
      data: item,
    }));
    return items;
  },
};

export const newFile = createTrigger({
  auth: googleDriveAuth,
  name: 'new_file',
  classification: 'READ',
  displayName: 'New File',
  description:
    'Triggers when a new file is added to Drive or the chosen folder.',
  aiMetadata: {
    description: 'Fires when a new file appears in Google Drive, optionally scoped to a specific parent folder. Each event represents one newly created file and its metadata, with optional inclusion of the file content.',
  },
  props: {
    parentFolder: common.parentFolderDropdown({
      displayName: 'Folder',
      description:
        'Leave empty to watch all of My Drive. Type to search by folder name.',
    }),
    include_team_drives: common.properties.include_team_drives,
    include_file_content: Property.Checkbox({
      displayName: 'Include File Content',
      description:
        'Also download each file. Slower, and very large files may fail.',
      required: false,
      defaultValue: false
    }),
  },
  outputSchema: newFileTriggerOutputSchema,
  type: TriggerStrategy.POLLING,
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
    const newFiles = await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });

    return await handleFileContent(newFiles, context)
  },
  test: async (context) => {
    const newFiles = await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });

    return await handleFileContent(newFiles, context)
  },

  sampleData: {
    kind: 'drive#file',
    mimeType: 'image/png',
    id: '1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5',
    name: 'google-drive.png',
    webViewLink:
      'https://drive.google.com/file/d/1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5/view?usp=drivesdk',
    createdTime: '2026-08-20T09:12:44.000Z',
    modifiedTime: '2026-08-20T09:12:44.000Z',
  },
});

async function handleFileContent(newFiles: unknown[], context: any) {
  const newFilesObj = JSON.parse(JSON.stringify(newFiles))

  if (context.propsValue.include_file_content) {
    const fileContentPromises: Promise<string>[] = []
    for (const file of newFilesObj) {
      fileContentPromises.push(downloadFileFromDrive(context.auth, context.files, file["id"], file["name"]));
    }

    const filesContent = await Promise.all(fileContentPromises)

    for (let i = 0; i < newFilesObj.length; i++) {
      newFilesObj[i].content = filesContent[i]
    }
  }
  return newFilesObj
}