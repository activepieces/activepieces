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
import { oneDriveAuth } from '../..';
import { oneDriveCommon } from '../common/common';

const polling: Polling<
  PiecePropValueSchema<typeof oneDriveAuth>,
  { parentFolder?: any }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const currentValues =
      (await oneDriveCommon.getFiles(auth, {
        parentFolder: propsValue.parentFolder,
        createdTime: lastFetchEpochMS,
      })) ?? [];
    const items = currentValues.map((item: any) => ({
      epochMilliSeconds: dayjs(item.createdDateTime).valueOf(),
      data: item,
    }));
    return items;
  },
};

export const newFile = createTrigger({
  auth: oneDriveAuth,
  name: 'new_file',
  displayName: 'New File',
  description: 'Trigger when a new file is uploaded.',
  props: {
    parentFolder: oneDriveCommon.parentFolder,
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
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  sampleData: {
    id: '123456',
    name: 'example.jpg',
    createdDateTime: '2023-09-25T12:34:17Z',
  },
});
