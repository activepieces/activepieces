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

const polling: Polling<
  PiecePropValueSchema<typeof googleDriveAuth>,
  { parentFolder?: any }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const currentValues =
      (await common.getFiles(auth, {
        parent: propsValue.parentFolder,
        createdTime: lastFetchEpochMS,
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
  displayName: 'New File',
  description: 'Trigger when a new file is uploaded.',
  props: {
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
    getFileContent: Property.Checkbox({
      displayName: 'Get files content',
      description: 'Check this box to get files content',
      required: false,
      defaultValue: false
    }),
  },
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
    });

    const newFilesObj = JSON.parse(JSON.stringify(newFiles))

    for (let i = 0; i < newFilesObj.length; i++) {
      newFilesObj[i].link = ''
    }

    if (context.propsValue.getFileContent) {
      const fileContentPromises: Promise<string>[] = []
      for (const file of newFilesObj) {
        fileContentPromises.push(downloadFileFromDrive(context.auth, context.files, file["id"], file["name"]));
      }

      const filesContent = await Promise.all(fileContentPromises)

      for (let i = 0; i < newFilesObj.length; i++) {
        newFilesObj[i].link = filesContent[i]
      }

      return newFilesObj
    }
    else {
      return newFilesObj
    }
  },
  test: async (context) => {
    const newFiles = await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });

    const newFilesObj = JSON.parse(JSON.stringify(newFiles))

    for (let i = 0; i < newFilesObj.length; i++) {
      newFilesObj[i].link = ''
    }

    if (context.propsValue.getFileContent) {
      const fileContentPromises: Promise<string>[] = []
      for (const file of newFilesObj) {
        fileContentPromises.push(downloadFileFromDrive(context.auth, context.files, file["id"], file["name"]));
      }

      const filesContent = await Promise.all(fileContentPromises)

      for (let i = 0; i < newFilesObj.length; i++) {
        newFilesObj[i].link = filesContent[i]
      }

      return newFilesObj
    }
    else {
      return newFilesObj
    }
  },

  sampleData: {
    kind: 'drive#file',
    mimeType: 'image/jpeg',
    id: '1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5',
    name: 'sweep.jpg',
    link: 'https://cloud.activepieces.com/api/v1/step-files/signed?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCYm0.Xyoy5nA-S70M9JpRnvadLxUm'
  },
});
