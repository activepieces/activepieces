import { createAction, Property, PieceAuth, chunk } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  ZipWriter,
  BlobWriter,
  BlobReader,
  ZipWriterAddDataOptions,
} from '@zip.js/zip.js';
import { extension } from 'mime-types';
import querystring from 'querystring';
import { googleDriveAuth, GoogleDriveAuthValue, getAccessToken } from '../auth';
import { common } from '../common';
import { driveExportFolderAsZipOutputSchema } from '../output-schemas';

const DOWNLOAD_CONCURRENCY = 5;

const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

interface NativeFormatChoice {
  docs: 'skip' | 'pdf' | 'docx';
  sheets: 'skip' | 'pdf' | 'xlsx';
  slides: 'skip' | 'pdf' | 'pptx';
}

const NATIVE_TYPE_BY_MIME_TYPE: Record<string, keyof NativeFormatChoice> = {
  'application/vnd.google-apps.document': 'docs',
  'application/vnd.google-apps.spreadsheet': 'sheets',
  'application/vnd.google-apps.presentation': 'slides',
};

const NATIVE_EXPORT_MIME_TYPE: Record<string, Record<string, string>> = {
  'application/vnd.google-apps.document': {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  'application/vnd.google-apps.spreadsheet': {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  'application/vnd.google-apps.presentation': {
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
};

const encryptionMethodDescription = `
- ZipCrypto: Legacy encryption method with wide compatibility (not recommended for sensitive data)
- AES-256: Modern encryption with strong security (may not be supported by older zip clients)
`;

interface ZipFolderEntry {
  relativePath: string;
  fileId: string;
  isEmptyFolder: boolean;
  downloadUrl?: string;
}

interface DriveListItem {
  id: string;
  name: string;
  mimeType: string;
}

async function listFolderChildren({
  auth,
  folderId,
  includeTeamDrives,
}: {
  auth: GoogleDriveAuthValue;
  folderId: string;
  includeTeamDrives: boolean;
}): Promise<DriveListItem[]> {
  const accessToken = await getAccessToken(auth);
  const items: DriveListItem[] = [];

  const params: Record<string, string> = {
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'nextPageToken,files(id,name,mimeType)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: includeTeamDrives ? 'true' : 'false',
    corpora: includeTeamDrives ? 'allDrives' : 'user',
    pageSize: '1000',
  };

  let nextPageToken: string | undefined;
  do {
    if (nextPageToken) {
      params.pageToken = nextPageToken;
    }
    const response = await httpClient.sendRequest<{
      files: DriveListItem[];
      nextPageToken?: string;
    }>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(params)}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    items.push(...(response.body.files ?? []));
    nextPageToken = response.body.nextPageToken;
  } while (nextPageToken);

  return items;
}

async function walk({
  auth,
  folderId,
  relativePrefix,
  nativeFormats,
  includeTeamDrives,
  out,
}: {
  auth: GoogleDriveAuthValue;
  folderId: string;
  relativePrefix: string;
  nativeFormats: NativeFormatChoice;
  includeTeamDrives: boolean;
  out: ZipFolderEntry[];
}): Promise<void> {
  const children = await listFolderChildren({ auth, folderId, includeTeamDrives });

  if (children.length === 0) {
    if (relativePrefix.length > 0) {
      out.push({ relativePath: relativePrefix, fileId: folderId, isEmptyFolder: true });
    }
    return;
  }

  for (const item of children) {
    const itemPath = relativePrefix.length > 0 ? `${relativePrefix}/${item.name}` : item.name;

    if (item.mimeType === GOOGLE_FOLDER_MIME_TYPE) {
      await walk({ auth, folderId: item.id, relativePrefix: itemPath, nativeFormats, includeTeamDrives, out });
      continue;
    }

    const nativeType = NATIVE_TYPE_BY_MIME_TYPE[item.mimeType];
    if (nativeType) {
      const format = nativeFormats[nativeType];
      if (format === 'skip') {
        continue;
      }
      const exportMimeType = NATIVE_EXPORT_MIME_TYPE[item.mimeType][format];
      const fileExtension = extension(exportMimeType);
      out.push({
        relativePath: fileExtension ? `${itemPath}.${fileExtension}` : itemPath,
        fileId: item.id,
        isEmptyFolder: false,
        downloadUrl: `https://www.googleapis.com/drive/v3/files/${item.id}/export?mimeType=${encodeURIComponent(exportMimeType)}&supportsAllDrives=true`,
      });
      continue;
    }

    if (item.mimeType.startsWith('application/vnd.google-apps.')) {
      continue;
    }

    out.push({
      relativePath: itemPath,
      fileId: item.id,
      isEmptyFolder: false,
      downloadUrl: `https://www.googleapis.com/drive/v3/files/${item.id}?alt=media&supportsAllDrives=true`,
    });
  }
}

async function collectZipEntries({
  auth,
  rootFolderId,
  nativeFormats,
  includeTeamDrives,
}: {
  auth: GoogleDriveAuthValue;
  rootFolderId: string;
  nativeFormats: NativeFormatChoice;
  includeTeamDrives: boolean;
}): Promise<ZipFolderEntry[]> {
  const out: ZipFolderEntry[] = [];
  await walk({ auth, folderId: rootFolderId, relativePrefix: '', nativeFormats, includeTeamDrives, out });
  return out;
}

async function downloadZipEntryContent({
  auth,
  entry,
}: {
  auth: GoogleDriveAuthValue;
  entry: ZipFolderEntry;
}): Promise<Blob> {
  if (!entry.downloadUrl) {
    throw new Error(`No download URL for entry "${entry.relativePath}"`);
  }
  const accessToken = await getAccessToken(auth);
  const response = await fetch(entry.downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    if (response.status === 403 && body.includes('exportSizeLimitExceeded')) {
      throw new Error(
        `Export failed for "${entry.relativePath}": exceeds Drive's ~10MB export size limit.`
      );
    }
    throw new Error(
      `Failed to download "${entry.relativePath}" (HTTP ${response.status}): ${body}`
    );
  }
  return response.blob();
}

export const driveExportFolderAsZip = createAction({
  auth: googleDriveAuth,
  name: 'drive_export_folder_as_zip',
  displayName: 'Export Folder as Zip',
  description: 'Recursively export a Google Drive folder (with all subfolders) as a single zip file.',
  audience: 'human',
  aiMetadata: {
    description:
      'Recursively downloads every file in a Drive folder (including subfolders) and packages them into a single zip whose internal paths mirror the folder hierarchy. Native Google Docs/Sheets/Slides are converted per user-chosen format (PDF/Office format) or skipped. Fails the whole action if any single file cannot be downloaded/exported. Optionally password-protects the zip.',
    idempotent: true,
  },
  outputSchema: driveExportFolderAsZipOutputSchema,
  props: {
    folderId: Property.Dropdown({
      displayName: 'Folder',
      description: 'The Drive folder to export (including all subfolders).',
      required: true,
      auth: googleDriveAuth,
      refreshers: ['includeTeamDrives'],
      refreshOnSearch: true,
      options: async ({ auth, includeTeamDrives }, ctx) =>
        common.fetchFolderDropdownOptions({
          auth: auth as GoogleDriveAuthValue | undefined,
          searchValue: ctx?.searchValue,
          includeTeamDrives: includeTeamDrives as boolean | undefined,
        }),
    }),
    includeTeamDrives: Property.Checkbox({
      displayName: 'Include Team Drives',
      required: false,
      defaultValue: false,
    }),
    googleDocsFormat: Property.StaticDropdown({
      displayName: 'Google Docs',
      description: 'How to include native Google Docs found in the folder.',
      required: true,
      defaultValue: 'pdf',
      options: {
        options: [
          { label: 'Skip', value: 'skip' },
          { label: 'PDF', value: 'pdf' },
          { label: 'Word (DOCX)', value: 'docx' },
        ],
      },
    }),
    googleSheetsFormat: Property.StaticDropdown({
      displayName: 'Google Sheets',
      description: 'How to include native Google Sheets found in the folder.',
      required: true,
      defaultValue: 'pdf',
      options: {
        options: [
          { label: 'Skip', value: 'skip' },
          { label: 'PDF', value: 'pdf' },
          { label: 'Excel (XLSX)', value: 'xlsx' },
        ],
      },
    }),
    googleSlidesFormat: Property.StaticDropdown({
      displayName: 'Google Slides',
      description: 'How to include native Google Slides found in the folder.',
      required: true,
      defaultValue: 'pdf',
      options: {
        options: [
          { label: 'Skip', value: 'skip' },
          { label: 'PDF', value: 'pdf' },
          { label: 'PowerPoint (PPTX)', value: 'pptx' },
        ],
      },
    }),
    outputFileName: Property.ShortText({
      displayName: 'Output Zip File Name',
      required: true,
      defaultValue: 'export.zip',
    }),
    usePassword: Property.Checkbox({
      displayName: 'Use password',
      description: 'Enable password protection for the zip file',
      required: false,
      defaultValue: false,
    }),
    passwordOptions: Property.DynamicProperties({
      displayName: 'Password options',
      required: false,
      auth: PieceAuth.None(),
      refreshers: ['usePassword'],
      props: async ({ usePassword }) => {
        if (!usePassword) {
          return {};
        }

        const fields = {
          password: Property.ShortText({
            displayName: 'Password',
            required: true,
          }),
          encryptionMethod: Property.StaticDropdown({
            displayName: 'Encryption Method',
            description: encryptionMethodDescription,
            required: true,
            defaultValue: 'zipcrypto',
            options: {
              disabled: false,
              options: [
                { label: 'ZipCrypto (Most Compatible)', value: 'zipcrypto' },
                { label: 'AES-256 (Stronger Security)', value: 'aes-256' },
              ],
            },
          }),
        };

        return fields;
      },
    }),
  },
  async run(context) {
    const nativeFormats: NativeFormatChoice = {
      docs: context.propsValue.googleDocsFormat as NativeFormatChoice['docs'],
      sheets: context.propsValue.googleSheetsFormat as NativeFormatChoice['sheets'],
      slides: context.propsValue.googleSlidesFormat as NativeFormatChoice['slides'],
    };

    const entries = await collectZipEntries({
      auth: context.auth,
      rootFolderId: context.propsValue.folderId,
      nativeFormats,
      includeTeamDrives: context.propsValue.includeTeamDrives ?? false,
    });

    const blobWriter = new BlobWriter('application/zip');
    const zipWriter = new ZipWriter(blobWriter);

    const fileAddOptions: ZipWriterAddDataOptions = {};
    if (context.propsValue.usePassword) {
      const password = context.propsValue.passwordOptions?.['password'] as string;
      const encryptionMethod = context.propsValue.passwordOptions?.['encryptionMethod'] as string;

      fileAddOptions.password = password;

      switch (encryptionMethod) {
        case 'aes-256':
          fileAddOptions.encryptionStrength = 3;
          break;
        case 'zipcrypto':
        default:
          fileAddOptions.zipCrypto = true;
          break;
      }
    }

    const fileEntries = entries.filter((entry) => !entry.isEmptyFolder);
    for (const batch of chunk(fileEntries, DOWNLOAD_CONCURRENCY)) {
      const blobs = await Promise.all(
        batch.map((entry) => downloadZipEntryContent({ auth: context.auth, entry }))
      );
      for (let i = 0; i < batch.length; i++) {
        await zipWriter.add(batch[i].relativePath, new BlobReader(blobs[i]), fileAddOptions);
      }
    }

    for (const folder of entries.filter((entry) => entry.isEmptyFolder)) {
      await zipWriter.add(`${folder.relativePath}/`, undefined, { directory: true });
    }

    await zipWriter.close();
    const zipBlob = await blobWriter.getData();
    const zipBuffer = Buffer.from(await zipBlob.arrayBuffer());

    return context.files.write({
      data: zipBuffer,
      fileName: context.propsValue.outputFileName,
    });
  },
});
