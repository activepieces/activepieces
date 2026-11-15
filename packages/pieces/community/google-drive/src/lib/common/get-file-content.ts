import { Readable } from 'node:stream';
import { FilesService } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { extension } from 'mime-types';
import {
  GoogleDriveAuthValue,
  createGoogleClient,
  getAccessToken,
} from '../auth';

export async function downloadFileFromDrive({
  auth,
  files,
  fileId,
  fileName,
  signal,
}: {
  auth: GoogleDriveAuthValue;
  files: FilesService;
  fileId: string;
  fileName: string | undefined;
  signal?: AbortSignal;
}): Promise<string> {
  const driveMimeType = await lookUpMimeType({ auth, fileId, signal });
  const exportMimeType = GOOGLE_EXPORT_TYPES[driveMimeType];
  const encodedId = encodeURIComponent(fileId);
  const url = exportMimeType
    ? `https://www.googleapis.com/drive/v3/files/${encodedId}/export?mimeType=${encodeURIComponent(
        exportMimeType
      )}&supportsAllDrives=true`
    : `https://www.googleapis.com/drive/v3/files/${encodedId}?alt=media&supportsAllDrives=true`;
  return googledlCall({
    url,
    auth,
    files,
    fileName: downloadName({
      fileId,
      fileName,
      finalMimeType: exportMimeType ?? driveMimeType,
      exported: exportMimeType !== undefined,
    }),
    signal,
  });
}

async function lookUpMimeType({
  auth,
  fileId,
  signal,
}: {
  auth: GoogleDriveAuthValue;
  fileId: string;
  signal: AbortSignal | undefined;
}): Promise<string> {
  const drive = googleDrive({
    version: 'v3',
    auth: await createGoogleClient(auth),
  });
  const response = await drive.files
    .get(
      { fileId, fields: 'mimeType, name', supportsAllDrives: true },
      { signal }
    )
    .catch((error: unknown) => {
      throw new Error(
        `Google Drive could not read file ${fileId}: ${driveErrorText(error)}`
      );
    });
  const mimeType = response.data.mimeType;
  if (!mimeType) {
    throw new Error(
      `Google Drive could not read file ${fileId}: no file type was returned.`
    );
  }
  return mimeType;
}

function driveErrorText(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
      ? ` (${error.status})`
      : '';
  return `${message}${status}`;
}

function downloadName({
  fileId,
  fileName,
  finalMimeType,
  exported,
}: {
  fileId: string;
  fileName: string | undefined;
  finalMimeType: string;
  exported: boolean;
}): string {
  const ext = extension(finalMimeType);
  if (!fileName) {
    return ext ? `${fileId}.${ext}` : fileId;
  }
  if (!exported || !ext) {
    return fileName;
  }
  return fileName.toLowerCase().endsWith(`.${ext}`)
    ? fileName
    : `${fileName}.${ext}`;
}

async function googledlCall({
  url,
  auth,
  files,
  fileName,
  signal,
}: {
  url: string;
  auth: GoogleDriveAuthValue;
  files: FilesService;
  fileName: string;
  signal: AbortSignal | undefined;
}): Promise<string> {
  const accessToken = await getAccessToken(auth);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  }).catch((error: unknown) =>
    Promise.reject(
      new Error(
        `Error when download file:\n\tDownload file response: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    )
  );

  if (!response.ok || !response.body) {
    throw new Error(
      `Error when download file:\n\tDownload file response: ${response.status} ${response.statusText}`
    );
  }

  signal?.throwIfAborted();

  return files.write({
    fileName,
    // @ts-expect-error -- undici streams a Node web ReadableStream body; the DOM fetch types omit the fromWeb overload
    data: Readable.fromWeb(response.body),
  });
}

const GOOGLE_EXPORT_TYPES: Record<string, string | undefined> = {
  'application/vnd.google-apps.document':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.google-apps.spreadsheet':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.google-apps.presentation':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};
