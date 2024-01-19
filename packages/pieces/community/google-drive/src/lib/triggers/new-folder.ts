import {
  PiecePropValueSchema,
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

const polling: Polling<
  PiecePropValueSchema<typeof googleDriveAuth>,
  { parentFolder?: any }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const currentValues =
      (await common.getFolders(auth, {
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

export const newFolder = createTrigger({
  auth: googleDriveAuth,
  name: 'new_folder',
  displayName: 'New Folder',
  description: 'Trigger when a new folder is created or uploaded.',
  props: {
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
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
    kind: 'drive#file',
    mimeType: 'application/vnd.google-apps.folder',
    id: '1aMEtTqIYn5651wdK7WLxaK_SDim4mvXW',
    name: 'New Folder WOOOO',
  },
});
