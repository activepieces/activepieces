import {
  AppConnectionValueForAuthProperty,
  MarkdownVariant,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { googleDriveAuth } from '../auth';
import { common } from '../common';
import { drivePoll, PollEntry } from '../common/drive-poll';
import { DriveFile, driveFileContent } from '../common/file-content';
import { newOrUpdatedFileTriggerOutputSchema } from '../output-schemas';

export const newOrUpdatedFile = createTrigger({
  auth: googleDriveAuth,
  name: 'new_or_updated_file',
  classification: 'READ',
  displayName: 'New or Updated File',
  description:
    'Triggers when a file is created or edited. A rename counts; trashing or moving does not.',
  aiMetadata: {
    description:
      'Fires when a file is created or modified in Google Drive, based on its creation and last-modified times (polling), optionally scoped to a parent folder and to specific file types. Each event represents one file and its metadata, carries a changeType of created or updated, and can include the file content, falling back to a contentError field when a download fails. Choose this over New File when edits to files that already exist should also trigger the flow.',
  },
  props: {
    behaviourNote: Property.MarkDown({
      value:
        'Each event carries a Change Type of created or updated. Several edits between two checks arrive as one event. A chosen folder is watched one level deep, not its subfolders.',
      variant: MarkdownVariant.INFO,
    }),
    parentFolder: common.parentFolderDropdown({
      displayName: 'Folder',
      description: common.watchFolderHint,
    }),
    include_team_drives: common.properties.include_team_drives,
    file_types: Property.StaticMultiSelectDropdown({
      displayName: 'File Types',
      description:
        'Empty watches every type. Use Dynamic value to add other MIME types.',
      required: false,
      options: {
        options: [
          { label: 'Google Sheets', value: 'application/vnd.google-apps.spreadsheet' },
          { label: 'Google Docs', value: 'application/vnd.google-apps.document' },
          { label: 'Google Slides', value: 'application/vnd.google-apps.presentation' },
          {
            label: 'Excel (XLSX)',
            value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          { label: 'Excel 97-2003 (XLS)', value: 'application/vnd.ms-excel' },
          { label: 'CSV', value: 'text/csv' },
          {
            label: 'Word (DOCX)',
            value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
          {
            label: 'PowerPoint (PPTX)',
            value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          },
          { label: 'PDF', value: 'application/pdf' },
          { label: 'Plain Text (TXT)', value: 'text/plain' },
          { label: 'PNG', value: 'image/png' },
          { label: 'JPEG', value: 'image/jpeg' },
          { label: 'ZIP', value: 'application/zip' },
        ],
      },
    }),
    include_file_content: Property.Checkbox({
      displayName: 'Include File Content',
      description:
        'Also download each file. A failed download adds an error instead.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: newOrUpdatedFileTriggerOutputSchema,
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
      list: async ({ from, maxFiles, positions }) => {
        const scope = {
          parent: context.propsValue.parentFolder,
          mimeTypes: context.propsValue.file_types,
          excludeShortcuts: true,
          includeTeamDrive: context.propsValue.include_team_drives,
          deadline: startedAt + common.listingBudgetMs,
          stopAt: { maxFiles },
        };
        return Promise.all([
          common.getFiles(
            context.auth,
            {
              ...scope,
              createdTime: from,
              createdTimeOp: '>=',
              resume: positions[0],
            },
            'createdTime'
          ),
          common.getFiles(
            context.auth,
            {
              ...scope,
              modifiedTime: from,
              modifiedTimeOp: '>=',
              resume: positions[1],
            },
            'modifiedTime'
          ),
        ]);
      },
      describe: ({ file, from, firedIds }) =>
        changeEntry({ file, from, firedIds }),
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
    changeType: 'updated',
    kind: 'drive#file',
    id: '1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5',
    name: 'quarterly-report.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    webViewLink:
      'https://docs.google.com/spreadsheets/d/1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5/edit?usp=drivesdk',
    createdTime: '2026-08-20T09:12:44.000Z',
    modifiedTime: '2026-08-25T14:34:07.000Z',
  },
});

function buildPolling({
  listingDeadline,
}: {
  listingDeadline: number;
}): Polling<AppConnectionValueForAuthProperty<typeof googleDriveAuth>, NewOrUpdatedFileProps> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
      const isTestMode = lastFetchEpochMS === 0;
      const listing = await common.getFiles(
        auth,
        {
          parent: propsValue.parentFolder,
          changedSince: isTestMode ? undefined : lastFetchEpochMS,
          mimeTypes: propsValue.file_types,
          excludeShortcuts: true,
          includeTeamDrive: propsValue.include_team_drives,
          maxPages: isTestMode ? common.testSampleMaxPages : undefined,
          accept: isTestMode ? isSampleCandidate : undefined,
          deadline: listingDeadline,
        },
        'modifiedTime desc'
      );

      const now = Date.now();

      return listing.files
        .filter(driveFileContent.isDriveFile)
        .filter((file) => isDeliverable({ file, now }))
        .map((file) => ({
          epochMilliSeconds: changedAtEpoch(file),
          data: { ...file, changeType: resolveChangeType({ file, lastFetchEpochMS }) },
        }));
    },
  };
}

function changeEntry({
  file,
  from,
  firedIds,
}: {
  file: unknown;
  from: number;
  firedIds: Set<string>;
}): PollEntry | undefined {
  if (!driveFileContent.isDriveFile(file)) {
    return undefined;
  }
  const createdAt = epochOf(file.createdTime);
  const changeType: DriveFileChangeType =
    createdAt >= from && !firedIds.has(file.id) ? 'created' : 'updated';
  return {
    id: file.id,
    epoch: changedAtEpoch(file),
    data: { ...file, changeType },
  };
}

function epochOf(timestamp: string | undefined): number {
  return typeof timestamp === 'string' && dayjs(timestamp).isValid()
    ? dayjs(timestamp).valueOf()
    : 0;
}

function changedAtEpoch(file: DriveFile): number {
  return Math.max(epochOf(file.modifiedTime), epochOf(file.createdTime));
}

function isDeliverable({ file, now }: { file: DriveFile; now: number }): boolean {
  const changedAt = changedAtEpoch(file);
  return changedAt > 0 && changedAt <= now;
}

function isSampleCandidate(file: unknown): boolean {
  return (
    driveFileContent.isDriveFile(file) &&
    isDeliverable({ file, now: Date.now() })
  );
}

function resolveChangeType({
  file,
  lastFetchEpochMS,
}: {
  file: DriveFile;
  lastFetchEpochMS: number;
}): DriveFileChangeType {
  if (lastFetchEpochMS > 0) {
    return epochOf(file.createdTime) > lastFetchEpochMS ? 'created' : 'updated';
  }
  return epochOf(file.modifiedTime) > epochOf(file.createdTime)
    ? 'updated'
    : 'created';
}

type DriveFileChangeType = 'created' | 'updated';

type NewOrUpdatedFileProps = {
  parentFolder?: string;
  include_team_drives?: boolean;
  file_types?: string[];
  include_file_content?: boolean;
};
