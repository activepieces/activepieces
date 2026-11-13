import { FilesService, tryCatch } from '@activepieces/pieces-framework';
import { GoogleDriveAuthValue } from '../auth';
import { driveDeadline } from './deadline';
import { downloadFileFromDrive } from './get-file-content';
import { drivePool } from './pool';

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
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return { error: lastError };
    }
    const { signal, cancel } = driveDeadline.abortAfter(remaining);
    const { data, error } = await tryCatch(() =>
      driveDeadline.untilAborted({
        promise: downloadFileFromDrive({
          auth,
          files,
          fileId: file.id,
          fileName: file.name,
          signal,
        }),
        signal,
        message: CONTENT_BUDGET_EXCEEDED,
      })
    );
    cancel();
    if (error === null && data !== null) {
      return { content: data };
    }
    if (signal.aborted) {
      return { error: CONTENT_BUDGET_EXCEEDED };
    }
    lastError = error === null ? 'Download returned no content' : error.message;
    const backoff = attempt * CONTENT_RETRY_DELAY_MS + jitterMs();
    if (attempt >= CONTENT_DOWNLOAD_ATTEMPTS || Date.now() + backoff >= deadline) {
      break;
    }
    await delay(backoff);
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

  return drivePool.mapInPool({
    items,
    concurrency: FILE_CONTENT_CONCURRENCY,
    map: async (item) => {
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
    },
  });
}

const FILE_CONTENT_CONCURRENCY = 5;
const CONTENT_DOWNLOAD_ATTEMPTS = 3;
const CONTENT_RETRY_DELAY_MS = 500;
const CONTENT_RETRY_JITTER_MS = 250;
const CONTENT_BUDGET_EXCEEDED =
  'Timed out before the file content could be downloaded';

const CONTENT_BUDGET_MS = 40_000;

export const driveFileContent = {
  withFileContent,
  isDriveFile,
  budgetMs: CONTENT_BUDGET_MS,
};

type DriveFileContent = { content: string } | { error: string };

export type DriveFile = {
  id: string;
  name: string;
  mimeType?: string;
  webViewLink?: string;
  kind?: string;
  createdTime?: string;
  modifiedTime?: string;
};
