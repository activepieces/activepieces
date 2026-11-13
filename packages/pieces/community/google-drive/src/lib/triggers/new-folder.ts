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
import { drivePoll } from '../common/drive-poll';
import { newFolderTriggerOutputSchema } from '../output-schemas';

export const newFolder = createTrigger({
  auth: googleDriveAuth,
  name: 'new_folder',
  classification: 'READ',
  displayName: 'New Folder',
  description:
    'Triggers when a new folder is created in Drive or the chosen folder.',
  aiMetadata: {
    description: 'Fires when a new folder is created in Google Drive, optionally scoped to a specific parent folder, based on the folder\'s creation time (polling). A folder moved into the watched folder from elsewhere fires only if it was created after the last folder the trigger sent. Each event represents one newly created folder and its metadata.',
  },
  props: {
    parentFolder: common.parentFolderDropdown({
      displayName: 'Folder',
      description: common.watchFolderHint,
    }),
    include_team_drives: common.properties.include_team_drives,
  },
  outputSchema: newFolderTriggerOutputSchema,
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(
      buildPolling({ listingDeadline: Date.now() + common.listingBudgetMs }),
      context
    );
    await drivePoll.onEnable({
      store: context.store,
      isRepublish: context.isRepublish,
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(
      buildPolling({ listingDeadline: Date.now() + common.listingBudgetMs }),
      context
    );
  },
  run: async (context) => {
    const startedAt = Date.now();
    return await drivePoll.poll({
      store: context.store,
      maxItems: drivePoll.maxItemsPerPoll({ includeFileContent: false }),
      list: async ({ from, maxFiles, positions }) => [
        await common.getFolders(
          context.auth,
          {
            parent: context.propsValue.parentFolder,
            createdTime: from,
            createdTimeOp: '>=',
            includeTeamDrive: context.propsValue.include_team_drives,
            deadline: startedAt + common.listingBudgetMs,
            stopAt: { maxFiles },
            resume: positions[0],
          },
          'createdTime'
        ),
      ],
      describe: ({ file }) => drivePoll.byCreatedTime(file),
    });
  },
  test: async (context) => {
    return await pollingHelper.test(
      buildPolling({ listingDeadline: Date.now() + common.listingBudgetMs }),
      context
    );
  },

  sampleData: {
    id: '1aMEtTqIYn5651wdK7WLxaK_SDim4mvXW',
    name: 'Invoices 2026',
    createdTime: '2026-08-20T09:12:44.000Z',
  },
});

function buildPolling({
  listingDeadline,
}: {
  listingDeadline: number;
}): Polling<AppConnectionValueForAuthProperty<typeof googleDriveAuth>, NewFolderProps> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
      const listing = await common.getFolders(auth, {
        parent: propsValue.parentFolder,
        createdTime: lastFetchEpochMS,
        includeTeamDrive: propsValue.include_team_drives,
        maxPages: lastFetchEpochMS === 0 ? common.testSampleMaxPages : undefined,
        accept: lastFetchEpochMS === 0 ? common.hasId : undefined,
        deadline: listingDeadline,
      });
      return listing.files.map((item) => ({
        epochMilliSeconds: dayjs(item.createdTime).valueOf(),
        data: item,
      }));
    },
  };
}

type NewFolderProps = {
  parentFolder?: string;
  include_team_drives?: boolean;
};
