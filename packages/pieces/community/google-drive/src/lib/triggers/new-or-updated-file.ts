import {
  AppConnectionValueForAuthProperty,
  FilesService,
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
import { GoogleDriveAuthValue, googleDriveAuth } from '../auth';
import { common } from '../common';
import { downloadFileFromDrive } from '../common/get-file-content';
import { newOrUpdatedFileTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof googleDriveAuth>,
  NewOrUpdatedFileProps
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const isTestMode = lastFetchEpochMS === 0;
    const files: DriveFile[] =
      (await common.getFiles(
        auth,
        {
          parent: propsValue.parentFolder,
          changedSince: isTestMode ? undefined : lastFetchEpochMS,
          mimeTypes: propsValue.file_types,
          excludeShortcuts: true,
          includeTeamDrive: propsValue.include_team_drives,
          maxPages: isTestMode ? 1 : undefined,
        },
        'modifiedTime desc'
      )) ?? [];

    return files.filter(hasUsableTimestamp).map((file) => ({
      epochMilliSeconds: changedAtEpoch(file),
      data: { ...file, changeType: resolveChangeType({ file, lastFetchEpochMS }) },
    }));
  },
};

export const newOrUpdatedFile = createTrigger({
  auth: googleDriveAuth,
  name: 'new_or_updated_file',
  classification: 'READ',
  displayName: 'New or Updated File',
  description:
    'Trigger when a file is created or updated. Each event carries a Change Type of created or updated. Renames and metadata edits count as updates. Trashing a file is not an event, and neither is restoring one from the bin or moving an existing file into the watched folder. Selecting a parent folder watches its direct children only, not sub-folders.',
  aiMetadata: {
    description:
      'Fires when a file is created or modified in Google Drive, based on its creation and last-modified times (polling), optionally scoped to a parent folder and to specific file types. Each event represents one file and its metadata, carries a changeType of created or updated, and can include the file content. Choose this over New File when edits to files that already exist should also trigger the flow.',
  },
  props: {
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
    file_types: Property.StaticMultiSelectDropdown({
      displayName: 'File Types',
      description:
        "Only fire for files of these types. Leave empty to watch every type. If the type you need is not listed, switch this field to 'Dynamic value' (the toggle next to the field) and provide a list of MIME types.",
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
        'Include the file content in the output. This will increase the time taken to fetch the files and might cause issues with large files.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: newOrUpdatedFileTriggerOutputSchema,
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      isRepublish: context.isRepublish,
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
    const items = await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });

    return await withFileContent({
      auth: context.auth,
      files: context.files,
      items,
      includeFileContent: context.propsValue.include_file_content,
    });
  },
  test: async (context) => {
    const items = await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });

    return await withFileContent({
      auth: context.auth,
      files: context.files,
      items,
      includeFileContent: context.propsValue.include_file_content,
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

function epochOf(timestamp: string | undefined): number {
  return typeof timestamp === 'string' && dayjs(timestamp).isValid()
    ? dayjs(timestamp).valueOf()
    : 0;
}

function changedAtEpoch(file: DriveFile): number {
  return Math.max(epochOf(file.modifiedTime), epochOf(file.createdTime));
}

function hasUsableTimestamp(file: DriveFile): boolean {
  return changedAtEpoch(file) > 0;
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

function isDriveFile(value: unknown): value is DriveFile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string'
  );
}

async function downloadContentOrSkip({
  auth,
  files,
  file,
}: {
  auth: GoogleDriveAuthValue;
  files: FilesService;
  file: DriveFile;
}): Promise<string | undefined> {
  try {
    return await downloadFileFromDrive(auth, files, file.id, file.name);
  } catch {
    return undefined;
  }
}

async function withFileContent({
  auth,
  files,
  items,
  includeFileContent,
}: {
  auth: GoogleDriveAuthValue;
  files: FilesService;
  items: unknown[];
  includeFileContent: boolean | undefined;
}): Promise<unknown[]> {
  if (!includeFileContent) {
    return items;
  }

  const enriched: unknown[] = [];
  for (let index = 0; index < items.length; index += FILE_CONTENT_CONCURRENCY) {
    const batch = items.slice(index, index + FILE_CONTENT_CONCURRENCY);
    const withContent = await Promise.all(
      batch.map(async (item) => {
        if (!isDriveFile(item)) {
          return item;
        }
        const content = await downloadContentOrSkip({ auth, files, file: item });
        return content === undefined ? item : { ...item, content };
      })
    );
    enriched.push(...withContent);
  }
  return enriched;
}

const FILE_CONTENT_CONCURRENCY = 5;

type DriveFileChangeType = 'created' | 'updated';

type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  kind?: string;
  createdTime?: string;
  modifiedTime?: string;
};

type NewOrUpdatedFileProps = {
  parentFolder?: string;
  include_team_drives?: boolean;
  file_types?: string[];
  include_file_content?: boolean;
};
