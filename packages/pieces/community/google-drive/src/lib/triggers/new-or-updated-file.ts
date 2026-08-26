import {
  AppConnectionValueForAuthProperty,
  FilesService,
  Property,
  TriggerStrategy,
  createTrigger,
  tryCatch,
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
    const listed: unknown[] =
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

    const now = Date.now();

    return listed
      .filter(isDriveFile)
      .filter((file) => isDeliverable({ file, now }))
      .map((file) => ({
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
    'Trigger when a file is created or updated, checked on a schedule. Each event carries a Change Type of created or updated, and several edits between two checks arrive as a single event. Renaming a file counts as an update. Trashing a file is not an event, and neither is restoring one from the bin nor moving an existing file into the watched folder. Selecting a parent folder watches its direct children only, not sub-folders.',
  aiMetadata: {
    description:
      'Fires when a file is created or modified in Google Drive, based on its creation and last-modified times (polling), optionally scoped to a parent folder and to specific file types. Each event represents one file and its metadata, carries a changeType of created or updated, and can include the file content, falling back to a contentError field when a download fails. Choose this over New File when edits to files that already exist should also trigger the flow.',
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
        'Include the file content in the output. This will increase the time taken to fetch the files and might cause issues with large files. If a download fails the event still arrives, carrying a File Content Error instead of the content.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: newOrUpdatedFileTriggerOutputSchema,
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, context);
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, context);
  },
  run: async (context) => {
    const deadline = Date.now() + CONTENT_BUDGET_MS;
    const items = await pollingHelper.poll(polling, context);

    return await withFileContent({
      auth: context.auth,
      files: context.files,
      items,
      includeFileContent: context.propsValue.include_file_content,
      deadline,
    });
  },
  test: async (context) => {
    const deadline = Date.now() + CONTENT_BUDGET_MS;
    const items = await pollingHelper.test(polling, context);

    return await withFileContent({
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitterMs(): number {
  return Math.floor(Math.random() * CONTENT_RETRY_JITTER_MS);
}

async function downloadContent({
  auth,
  files,
  file,
  deadline,
}: {
  auth: GoogleDriveAuthValue;
  files: FilesService;
  file: DriveFile;
  deadline: number;
}): Promise<DriveFileContent> {
  let lastError = CONTENT_BUDGET_EXCEEDED;
  for (let attempt = 1; attempt <= CONTENT_DOWNLOAD_ATTEMPTS; attempt++) {
    if (Date.now() >= deadline) {
      return { error: lastError };
    }
    const { data, error } = await tryCatch(() =>
      downloadFileFromDrive(auth, files, file.id, file.name)
    );
    if (error === null && data !== null) {
      return { content: data };
    }
    lastError = error === null ? 'Download returned no content' : error.message;
    const backoff = attempt * CONTENT_RETRY_DELAY_MS + jitterMs();
    if (attempt < CONTENT_DOWNLOAD_ATTEMPTS && Date.now() + backoff < deadline) {
      await delay(backoff);
    }
  }
  return { error: lastError };
}

async function withFileContent({
  auth,
  files,
  items,
  includeFileContent,
  deadline,
}: {
  auth: GoogleDriveAuthValue;
  files: FilesService;
  items: unknown[];
  includeFileContent: boolean | undefined;
  deadline: number;
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
        const result = await downloadContent({
          auth,
          files,
          file: item,
          deadline,
        });
        return 'content' in result
          ? { ...item, content: result.content }
          : { ...item, contentError: result.error };
      })
    );
    enriched.push(...withContent);
  }
  return enriched;
}

const FILE_CONTENT_CONCURRENCY = 5;
const CONTENT_DOWNLOAD_ATTEMPTS = 3;
const CONTENT_RETRY_DELAY_MS = 500;
const CONTENT_RETRY_JITTER_MS = 250;
const CONTENT_BUDGET_MS = 40_000;
const CONTENT_BUDGET_EXCEEDED =
  'Timed out before the file content could be downloaded';

type DriveFileChangeType = 'created' | 'updated';

type DriveFileContent = { content: string } | { error: string };

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
