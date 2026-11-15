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
import { drivePoll } from '../common/drive-poll';
import { driveFileContent } from '../common/file-content';
import { newFileTriggerOutputSchema } from '../output-schemas';

export const newFile = createTrigger({
  auth: googleDriveAuth,
  name: 'new_file',
  classification: 'READ',
  displayName: 'New File',
  description:
    "Triggers when a file is created in Drive or the chosen folder. Uploads and copies count. A file moved in from another folder fires only if it is newer than the last file this trigger sent.",
  aiMetadata: {
    description: 'Fires when a file is created in Google Drive, optionally scoped to a specific parent folder, based on the file\'s creation time (polling). Uploads and copies fire; a file moved into the folder from elsewhere fires only if it was created after the last file the trigger sent. Each event represents one newly created file and its metadata, and can include the file content, falling back to a contentError field when a download fails.',
  },
  props: {
    parentFolder: common.parentFolderDropdown({
      displayName: 'Folder',
      description: common.watchFolderHint,
    }),
    include_team_drives: common.properties.include_team_drives,
    include_file_content: Property.Checkbox({
      displayName: 'Include File Content',
      description:
        'Also download each file. A failed download adds an error instead.',
      required: false,
      defaultValue: false
    }),
  },
  outputSchema: newFileTriggerOutputSchema,
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
    const deadline = startedAt + driveFileContent.budgetMs;
    const includeFileContent = context.propsValue.include_file_content;
    const items = await drivePoll.poll({
      store: context.store,
      maxItems: drivePoll.maxItemsPerPoll({ includeFileContent }),
      list: async ({ from, maxFiles, positions }) => [
        await common.getFiles(
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

    return await driveFileContent.withFileContent({
      auth: context.auth,
      files: context.files,
      items,
      includeFileContent,
      deadline,
    });
  },
  test: async (context) => {
    const startedAt = Date.now();
    const deadline = startedAt + driveFileContent.budgetMs;
    const items = await pollingHelper.test(
      buildPolling({ listingDeadline: startedAt + common.listingBudgetMs }),
      context
    );

    return await driveFileContent.withFileContent({
      auth: context.auth,
      files: context.files,
      items,
      includeFileContent: context.propsValue.include_file_content,
      deadline,
    });
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

function buildPolling({
  listingDeadline,
}: {
  listingDeadline: number;
}): Polling<AppConnectionValueForAuthProperty<typeof googleDriveAuth>, NewFileProps> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
      const listing = await common.getFiles(auth, {
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

type NewFileProps = {
  parentFolder?: string;
  include_team_drives?: boolean;
  include_file_content?: boolean;
};
