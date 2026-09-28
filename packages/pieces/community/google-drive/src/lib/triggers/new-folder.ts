import {
  AppConnectionValueForAuthProperty,
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
import { newFolderTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof googleDriveAuth>,
  { parentFolder?: any,include_team_drives?:boolean }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const currentValues =
      (await common.getFolders(auth, {
        parent: propsValue.parentFolder,
        createdTime: lastFetchEpochMS,
        includeTeamDrive:propsValue.include_team_drives
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
  classification: 'READ',
  displayName: 'New Folder',
  description:
    'Triggers when a new folder is created in Drive or the chosen folder.',
  aiMetadata: {
    description: 'Fires when a new folder is created in Google Drive, optionally scoped to a specific parent folder. Each event represents one newly created folder and its metadata.',
  },
  props: {
    parentFolder: common.parentFolderDropdown({
      displayName: 'Folder',
      description:
        'Leave empty to watch all of My Drive. Type to search by folder name.',
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  outputSchema: newFolderTriggerOutputSchema,
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
    return await pollingHelper.poll(polling, context);
  },
  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },

  sampleData: {
    kind: 'drive#file',
    mimeType: 'application/vnd.google-apps.folder',
    id: '1aMEtTqIYn5651wdK7WLxaK_SDim4mvXW',
    name: 'Invoices 2026',
    createdTime: '2026-08-20T09:12:44.000Z',
  },
});
