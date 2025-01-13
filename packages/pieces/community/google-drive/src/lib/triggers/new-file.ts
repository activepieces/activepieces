import {
  PiecePropValueSchema,
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
import { googleDriveAuth } from '../..';
import { common } from '../common';
import { downloadFileFromDrive } from '../common/get-file-content';


// I didn't enforce the orderBy to always be createdTime desc because it probably will break the polling previously working
const getPolling = (isTesting: boolean) => {
  const polling: Polling<
  PiecePropValueSchema<typeof googleDriveAuth>,
  { parentFolder?: any; include_team_drives?: boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const currentValues =
      (await common.getFiles(auth, {
        parent: propsValue.parentFolder,
        createdTime: lastFetchEpochMS,
        includeTeamDrive: propsValue.include_team_drives,
      },isTesting ? 'createdTime desc': undefined)) ?? [];
    const items = currentValues.map((item: any) => ({
      epochMilliSeconds: dayjs(item.createdTime).valueOf(),
      data: item,
    }));
    return items;
  },
};
return polling;
}


export const newFile = createTrigger({
  auth: googleDriveAuth,
  name: 'new_file',
  displayName: 'New File',
  description: 'Trigger when a new file is uploaded.',
  props: {
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
    include_file_content: Property.Checkbox({
      displayName: 'Include File Content',
      description: 'Include the file content in the output. This will increase the time taken to fetch the files and might cause issues with large files.',
      required: false,
      defaultValue: false
    }),
  },
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(getPolling(false), {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(getPolling(false), {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  run: async (context) => {
    const newFiles = await pollingHelper.poll(getPolling(false), {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });

    return await handleFileContent(newFiles, context)
  },
  test: async (context) => {
    const newFiles = await pollingHelper.test(getPolling(true), {
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
    link: 'https://cdn.activepieces.com/pieces/google-drive.png'
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